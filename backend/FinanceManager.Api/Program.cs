using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
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

var builder = WebApplication.CreateBuilder(args);

// Logging: structured Serilog events. Production writes one JSON object per
// line (searchable in Render's log explorer); development stays readable.
// Levels come from the "Serilog" section of appsettings.
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

// Unhandled errors become RFC 7807 responses carrying the request's trace id:
// the same id is in the logs and is shown to the user, so a report can be
// matched to exactly what happened.
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] = TraceId(context.HttpContext));

// Render terminates TLS in a proxy; trust its X-Forwarded-For so logs and
// rate limits see the real client IP.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Error reports from the browser may come before sign-in, so each client IP
// gets a small quota instead of an open door into the logs.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("client-logs", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
});

// Infrastructure (DbContext, Repositories)
builder.Services.AddInfrastructure(builder.Configuration);

// Application (Handlers, AutoMapper)
builder.Services.AddApplication();

// Authentication
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

builder.Services.AddAuthorization();

// Controllers + Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("X-Trace-Id");
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

// Every response says which trace it belongs to. Set as the response starts,
// because the exception handler clears headers before writing a 500.
app.Use(async (http, next) =>
{
    http.Response.OnStarting(() =>
    {
        http.Response.Headers["X-Trace-Id"] = TraceId(http);
        return Task.CompletedTask;
    });
    await next();
});

// One summary event per request: method, path, status, time and user.
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnostics, http) =>
        diagnostics.Set("UserId", http.User.FindFirstValue(ClaimTypes.NameIdentifier));
    // Render's health check hits Swagger every few seconds; keep it out of the logs.
    options.GetLevel = (http, _, error) =>
        error != null || http.Response.StatusCode >= 500 ? LogEventLevel.Error
        : http.Request.Path.StartsWithSegments("/swagger") ? LogEventLevel.Verbose
        : LogEventLevel.Information;
});

// After request logging, so a failed request is logged once with its 500.
app.UseExceptionHandler();

// Apply pending migrations on startup in every environment, so each deploy
// brings its own schema changes. Safe because the API runs as a single
// instance; if a migration fails, the app doesn't start.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Files transactions created before merchants existed under their merchant.
    var catalogued = await scope.ServiceProvider.GetRequiredService<IMediator>().Send(new CatalogTransactionsCommand());
    if (catalogued > 0) app.Logger.LogInformation("Catalogued {Count} transactions under their merchants", catalogued);
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>W3C trace id of the request (falls back to ASP.NET's own id).</summary>
static string TraceId(HttpContext http) => Activity.Current?.TraceId.ToString() ?? http.TraceIdentifier;
