using System.Net;
using System.Text;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.UseCases.Merchants.Queries.LookupCompany;
using FinanceManager.Infrastructure.Companies;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.UseCases.Merchants;

public class CompanyLookupTests
{
    [Theory]
    [InlineData("""{"cnae_fiscal":5611201,"cnae_fiscal_descricao":"Restaurantes","nome_fantasia":" Toru ","razao_social":"Toru Ltda"}""", "Toru")]
    [InlineData("""{"cnae_fiscal":5611201,"cnae_fiscal_descricao":"Restaurantes","nome_fantasia":"","razao_social":" Toru Ltda "}""", "Toru Ltda")]
    [InlineData("""{"cnae_fiscal":5611201,"cnae_fiscal_descricao":"Restaurantes"}""", null)]
    public async Task The_registry_reads_the_trade_name_or_the_legal_name(string body, string? name)
    {
        var registry = new BrasilApiCompanyRegistry(new HttpClient(new Stub(HttpStatusCode.OK, body)));

        Assert.Equal(name, (await registry.LookupAsync("12345678000190"))!.Name);
    }

    [Fact]
    public async Task Lookups_return_the_company_or_nothing()
    {
        var registry = new FakeRegistry();
        var handler = new LookupCompanyHandler(registry);

        var found = await handler.Handle(new LookupCompanyQuery("12.345.678/0001-90"));

        Assert.Equal(("12345678000190", "Toru", "Restaurantes"), (found!.Cnpj, found.Name, found.Activity));
        Assert.Null(await handler.Handle(new LookupCompanyQuery("123")));
        Assert.Null(await handler.Handle(new LookupCompanyQuery("99.999.999/0001-99")));
        registry.Fails = true;
        Assert.Null(await handler.Handle(new LookupCompanyQuery("12.345.678/0001-90")));
        registry.Fails = false;
        registry.TimesOut = true;
        Assert.Null(await handler.Handle(new LookupCompanyQuery("12.345.678/0001-90")));
    }

    [Fact]
    public async Task Alphanumeric_cnpjs_are_not_sent_to_the_registry()
    {
        var registry = new FakeRegistry();

        Assert.Null(await new LookupCompanyHandler(registry).Handle(new LookupCompanyQuery("12.ABC.345/01DE-35")));
        Assert.Equal(0, registry.Calls);
    }

    [Fact]
    public async Task Cancelling_the_request_is_not_hidden_as_a_missing_company()
    {
        var registry = new FakeRegistry { TimesOut = true };
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => new LookupCompanyHandler(registry).Handle(new LookupCompanyQuery("12.345.678/0001-90"), cancelled.Token));
    }

    [Fact]
    public async Task The_endpoint_answers_404_when_the_company_is_unknown()
    {
        var mediator = new FakeMediator();
        var controller = new MerchantsController(mediator).SignedIn(Guid.NewGuid());
        var dto = new CompanyDto { Cnpj = "12345678000190" };
        mediator.Returns<LookupCompanyQuery>(q => q.Cnpj == "12345678000190" ? dto : null);

        Assert.Same(dto, Assert.IsType<OkObjectResult>((await controller.LookupCompany("12345678000190")).Result).Value);
        Assert.IsType<NotFoundObjectResult>((await controller.LookupCompany("1")).Result);
    }

    private sealed class FakeRegistry : ICompanyRegistry
    {
        public bool Fails { get; set; }
        public bool TimesOut { get; set; }
        public int Calls { get; private set; }

        public Task<CompanyInfo?> LookupAsync(string cnpj, CancellationToken cancellationToken = default)
        {
            Calls++;
            if (TimesOut) throw cancellationToken.IsCancellationRequested ? new TaskCanceledException("cancelado", null, cancellationToken) : new TaskCanceledException("timeout");
            return Fails ? throw new HttpRequestException("fora")
                : Task.FromResult(cnpj == "12345678000190" ? new CompanyInfo("5611201", "Restaurantes", "Toru") : null);
        }
    }

    private sealed class Stub(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
    }
}
