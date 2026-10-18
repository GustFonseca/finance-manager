using System.Text.Json;
using FinanceManager.Api.Errors;
using FinanceManager.Aplication.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Tests.Api;

public class AppExceptionHandlerTests
{
    private static readonly IServiceProvider Services = new ServiceCollection().AddLogging().AddProblemDetails().BuildServiceProvider();

    private static async Task<(bool Handled, HttpContext Context, JsonElement? Body)> Handle(Exception exception)
    {
        var context = new DefaultHttpContext { RequestServices = Services };
        context.Response.Body = new MemoryStream();
        var handler = new AppExceptionHandler(Services.GetRequiredService<IProblemDetailsService>());

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        context.Response.Body.Position = 0;
        var text = await new StreamReader(context.Response.Body).ReadToEndAsync();
        return (handled, context, text.Length == 0 ? null : JsonDocument.Parse(text).RootElement);
    }

    [Theory]
    [InlineData(typeof(NotFoundException), StatusCodes.Status404NotFound)]
    [InlineData(typeof(BusinessRuleException), StatusCodes.Status400BadRequest)]
    [InlineData(typeof(UnauthorizedAccessException), StatusCodes.Status401Unauthorized)]
    public async Task Known_exceptions_become_problem_details_with_the_message(Type type, int status)
    {
        var exception = (Exception)Activator.CreateInstance(type, "Conta não encontrada.")!;

        var (handled, context, body) = await Handle(exception);

        Assert.True(handled);
        Assert.Equal(status, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
        Assert.Equal(status, body!.Value.GetProperty("status").GetInt32());
        Assert.Equal("Conta não encontrada.", body.Value.GetProperty("detail").GetString());
        Assert.Equal("Conta não encontrada.", body.Value.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Unknown_exceptions_are_left_to_the_default_handler()
    {
        var (handled, context, body) = await Handle(new InvalidOperationException("bug"));

        Assert.False(handled);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        Assert.Null(body);
    }
}
