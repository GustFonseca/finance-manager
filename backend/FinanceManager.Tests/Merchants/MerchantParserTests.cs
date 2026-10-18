using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Merchants;

public class MerchantParserTests
{
    private const string Owner = "Gustavo Fonseca Dias Silva";

    [Theory]
    [InlineData("Transferência enviada pelo Pix - IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A. - 14.380.200/0001-21 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 10000")]
    [InlineData("Transferência enviada pelo Pix - IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A. - 14.380.200/0001-21 - IFOOD PAGO IP (0595) Agência: 1 Conta: 101793197")]
    [InlineData("Compra no débito via NuPay - iFood")]
    [InlineData("Ifd*Restaurante Sabor Caseiro")]
    public void Every_way_the_bank_writes_iFood_is_one_merchant(string description)
    {
        var merchant = MerchantParser.Parse(description, TestRules.Default, Owner)!;

        Assert.Equal("iFood", merchant.Name);
        Assert.Equal("ifood", merchant.Key);
        Assert.Equal(MerchantKind.BUSINESS, merchant.Kind);
    }

    [Fact]
    public void A_pix_to_a_company_keeps_its_name_and_cnpj_without_the_bank()
    {
        var merchant = MerchantParser.Parse(
            "Transferência enviada pelo Pix - PANIFICADORA NOSSA MANIA LTDA                                - 05.649.358/0001-63 - ITAÚ UNIBANCO S.A. (0341) Agência: 3042 Conta: 98759-8", TestRules.Default)!;

        Assert.Equal("Panificadora Nossa Mania", merchant.Name);
        Assert.Equal("05.649.358/0001-63", merchant.Document);
        Assert.Equal(MerchantKind.BUSINESS, merchant.Kind);
    }

    [Theory]
    [InlineData("Transferência enviada pelo Pix - Ana Carolina de Oliveira e Silva - •••.312.146-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 9882318-6")]
    [InlineData("Transferência enviada pelo Pix - Ana Carolina de Oliveira e Silva (Transferência enviada)")]
    [InlineData("Transferência enviada pelo Pix via Open Banking - Iniciada por: Belvo - Ana Carolina de Oliveira e Silva - •••.312.146-•• - MERCADO PAGO IP LTDA.")]
    public void A_pix_to_a_person_is_a_person_however_it_is_written(string description)
    {
        var merchant = MerchantParser.Parse(description, TestRules.Default, Owner)!;

        Assert.Equal("Ana Carolina de Oliveira e Silva", merchant.Name);
        Assert.Equal(MerchantKind.PERSON, merchant.Kind);
    }

    [Theory]
    [InlineData("Transferência enviada pelo Pix - Gustavo Fonseca Dias Silva - •••.780.706-•• - CAIXA ECONOMICA FEDERAL (0104)", "Gustavo Fonseca Dias Silva")]
    [InlineData("Valor adicionado na conta por cartão de crédito - Valor adicionado para Pix no Crédito", "Crédito do cartão (Pix no crédito)")]
    [InlineData("Pagamento de fatura", "Fatura do cartão")]
    [InlineData("Resgate RDB", "Investimentos")]
    [InlineData("Aplicação RDB", "Investimentos")]
    [InlineData("Transferência de saldo NuInvest", "Investimentos")]
    [InlineData("Depósito de empréstimo", "Empréstimo recebido")]
    public void The_users_own_money_moving_is_marked_as_own(string description, string name)
    {
        var merchant = MerchantParser.Parse(description, TestRules.Default, Owner)!;

        Assert.Equal(name, merchant.Name);
        Assert.Equal(MerchantKind.OWN, merchant.Kind);
    }

    [Fact]
    public void A_mei_drops_its_cnpj_prefix_and_spacing_or_case_do_not_split_a_merchant()
    {
        var mei = MerchantParser.Parse(
            "Transferência enviada pelo Pix - 17.133.477 MARCIO ALVES DE OLIVEIRA JUNIOR - 17.133.477/0001-48 - NU PAGAMENTOS - IP (0260)", TestRules.Default)!;
        Assert.Equal("Marcio Alves de Oliveira Junior", mei.Name);
        Assert.Equal(MerchantKind.BUSINESS, mei.Kind);

        Assert.Equal(MerchantParser.Parse("Posto Avenida", TestRules.Default)!.Key, MerchantParser.Parse("POSTOAVENIDA", TestRules.Default)!.Key);
        Assert.Equal("99", MerchantParser.Parse("Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BCO", TestRules.Default)!.Name);
    }

    [Fact]
    public void Plain_bank_wording_is_never_taken_for_a_person()
    {
        Assert.Equal(MerchantKind.BUSINESS, MerchantParser.Parse("Crédito em conta", TestRules.Default)!.Kind);
        Assert.Null(MerchantParser.Parse("   ", TestRules.Default));
    }
}
