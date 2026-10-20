using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using FinanceManager.Aplication;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;
using FinanceManager.Infrastructure;
using FinanceManager.Infrastructure.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;
using FinanceManager.Api.Activity;
using FinanceManager.Api.Authorization;
using FinanceManager.Api.Caching;
using FinanceManager.Api.Errors;
using FinanceManager.Api.Security;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, logger) =>
{
    logger.ReadFrom.Configuration(builder.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();
    if (builder.Environment.IsDevelopment())
        logger.WriteTo.Console();
    else
        logger.WriteTo.Console(new RenderedCompactJsonFormatter());
});

builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] = TraceId(context.HttpContext));

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(RateLimits.Configure);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddApplication();

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";
if (!builder.Environment.IsDevelopment() && (jwtSecret.StartsWith("CHANGE-THIS") || jwtSecret.Length < 32))
    throw new InvalidOperationException("Jwt:Secret must be set to a private value of at least 32 characters (env var Jwt__Secret).");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddSingleton<IAuthorizationHandler, AdminRequirementHandler>();
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    options.AddPolicy(AdminPolicy.Name, policy => policy.RequireAuthenticatedUser().AddRequirements(new AdminRequirement()));
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = System.IO.Compression.CompressionLevel.Fastest);

builder.Services.AddOutputCache(options =>
{
    options.SizeLimit = 32 * 1024 * 1024;
    options.AddPolicy(UserDataCachePolicy.Name, new UserDataCachePolicy());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Finance Manager API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var corsOrigins = new CorsOrigins(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(corsOrigins.IsAllowed).AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("X-Trace-Id");
    });
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseResponseCompression();

app.Use(async (http, next) =>
{
    http.Response.OnStarting(() =>
    {
        http.Response.Headers["X-Trace-Id"] = TraceId(http);
        return Task.CompletedTask;
    });
    await next();
});

app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnostics, http) =>
        diagnostics.Set("UserId", http.User.FindFirstValue(ClaimTypes.NameIdentifier));
    options.GetLevel = (http, _, error) =>
        error != null || http.Response.StatusCode >= 500 ? LogEventLevel.Error
        : http.Request.Path.StartsWithSegments("/swagger") ? LogEventLevel.Verbose
        : LogEventLevel.Information;
});

app.UseExceptionHandler();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.Lifetime.ApplicationStarted.Register(() => _ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var catalogued = await scope.ServiceProvider.GetRequiredService<IMediator>().Send(new CatalogTransactionsCommand(), app.Lifetime.ApplicationStopping);
        if (catalogued > 0) app.Logger.LogInformation("Catalogued {Count} transactions under their merchants", catalogued);
    }
    catch (Exception ex) when (!app.Lifetime.ApplicationStopping.IsCancellationRequested)
    {
        app.Logger.LogWarning(ex, "Cataloguing transactions at startup failed");
    }
}));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<UserActivityTracking>();
app.UseMiddleware<UserCacheEviction>();
app.UseOutputCache();
app.MapControllers();

app.Run();

static string TraceId(HttpContext http) => Activity.Current?.TraceId.ToString() ?? http.TraceIdentifier;
