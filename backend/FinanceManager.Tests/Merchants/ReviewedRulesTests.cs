using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Companies;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Merchants;

public class ReviewedRulesTests
{
    private static readonly Aplication.Classification.ClassificationRules Rules = TestRules.Default;

    [Theory]
    [InlineData("Amil Assistencia Medica", true)]
    [InlineData("Farmacia Familia", false)]
    [InlineData("Transferência enviada pelo Pix - CAMILA ROCHA", false)]
    [InlineData("PAGSEGURO*PADARIAREAL", false)]
    [InlineData("Porto Seguro Auto", true)]
    [InlineData("Vibra Energia Posto Petrobras", false)]
    [InlineData("Enel Distribuicao Sao Paulo", true)]
    [InlineData("Sky Servicos de Banda Larga", true)]
    [InlineData("Cedae", true)]
    [InlineData("CPFL Paulista", true)]
    [InlineData("Energisa MT", true)]
    [InlineData("Claro Internet", true)]
    [InlineData("Compra na internet", false)]
    [InlineData("Agua Mineral Indaia", false)]
    [InlineData("Agua de coco", false)]
    public void Bills(string text, bool expected) => Assert.Equal(expected, Rules.IsBill(text));

    [Theory]
    [InlineData("Bet365", true)]
    [InlineData("Betano", true)]
    [InlineData("Sportingbet", true)]
    [InlineData("Estrela Bet", true)]
    [InlineData("Esportes da Sorte", true)]
    [InlineData("KTO Apostas", true)]
    [InlineData("Uber *Eats Pending", true)]
    [InlineData("Outback Steakhouse", true)]
    [InlineData("Barbearia do Joao", false)]
    [InlineData("Betoneira Locacoes", false)]
    public void Superfluous(string text, bool expected) => Assert.Equal(expected, Rules.IsSuperfluous(text));

    [Theory]
    [InlineData("Mercado Bitcoin", false)]
    [InlineData("Mercado Pago", false)]
    [InlineData("Mercadolivre Vendedor", false)]
    [InlineData("Mercadinho Sao Jose", true)]
    [InlineData("Compra de mercadorias", false)]
    [InlineData("Metropole Hotel", false)]
    [InlineData("Metro Sao Paulo", true)]
    [InlineData("Auto Posto Shell", true)]
    [InlineData("Uber Trip", true)]
    [InlineData("Uber Eats", false)]
    [InlineData("99 Tecnologia", true)]
    [InlineData("Ultra 99 Promo", false)]
    public void Groceries_and_transport(string text, bool expected) => Assert.Equal(expected, Rules.IsGrocery(text));

    [Theory]
    [InlineData("HBO Max", true)]
    [InlineData("DL*MAX.COM", true)]
    [InlineData("Max Atacadista", false)]
    [InlineData("Muffato Max", false)]
    [InlineData("Disneyplus", true)]
    [InlineData("Amazonprimebr", true)]
    [InlineData("Claude.ai Subscription", true)]
    [InlineData("Duolingo", true)]
    public void Subscriptions(string text, bool expected) => Assert.Equal(expected, Rules.IsSubscription(text));

    [Theory]
    [InlineData("Uber Eats", "Alimentação")]
    [InlineData("Uber Trip", "Transporte")]
    [InlineData("Bet365", "Lazer")]
    [InlineData("Amil Assistencia Medica", "Saúde")]
    [InlineData("Comercio varejista de gas liquefeito de petroleo", "Moradia")]
    [InlineData("Telefonia movel celular", "Moradia")]
    [InlineData("Atividades de condicionamento fisico", "Saúde")]
    [InlineData("Rendimento da conta", "Investimentos")]
    [InlineData("Juros de mora", null)]
    [InlineData("Resgate de garantia", null)]
    public void Category_hints(string text, string? expected) => Assert.Equal(expected, Rules.CategoryHint(text));

    [Theory]
    [InlineData("Pagamento de fatura", "Fatura do cartão")]
    [InlineData("PAGTO FATURA CARTAO", "Fatura do cartão")]
    [InlineData("PAGAMENTO FATURA INTER", "Fatura do cartão")]
    [InlineData("Pagamento recebido", "Fatura do cartão")]
    [InlineData("Pagamento recebido de MARIA SILVA - venda", null)]
    [InlineData("RES APLIC AUT MAIS", "Investimentos")]
    [InlineData("RESGATE INVEST FACIL", "Investimentos")]
    [InlineData("Guardado no cofrinho", "Investimentos")]
    public void Own_money(string text, string? expected) => Assert.Equal(expected, Rules.OwnMoney(text));

    [Theory]
    [InlineData("TAR PACOTE ITAU", "Tarifas bancárias")]
    [InlineData("ENCARGO LIMITE CRED", "Juros e encargos")]
    [InlineData("Encargos de atraso", "Juros e encargos")]
    public void Fees(string text, string expected) => Assert.Equal(expected, Rules.Fee(text));

    [Theory]
    [InlineData("Clinica Odontologica Sorriso", "Saúde")]
    [InlineData("Amil Assistencia Medica", "Saúde")]
    [InlineData("Clinica Veterinaria Pet", null)]
    [InlineData("Hospital Veterinario 24h", null)]
    [InlineData("Clinica de Estetica Bella", null)]
    [InlineData("Drogasil Medicamentos", null)]
    [InlineData("Saúde Drogasil", null)]
    [InlineData("Colegio Bandeirantes", "Educação")]
    [InlineData("Ensino de idiomas", null)]
    [InlineData("Kalunga Material Escolar", null)]
    public void Tax_deductions(string text, string? expected) => Assert.Equal(expected, Rules.TaxDeductible(text));

    [Theory]
    [InlineData("Disneyplus", "Disney+")]
    [InlineData("Amazonprimebr", "Amazon")]
    [InlineData("Mercado Pago", "Mercado Pago")]
    [InlineData("Mercado Pago Instituicao de Pagamento", "Mercado Pago")]
    [InlineData("MP Loja", null)]
    [InlineData("Pagseguro", "PagBank")]
    [InlineData("Pagseguro Padaria", null)]
    public void Brands(string text, string? expected) => Assert.Equal(expected, Rules.Brand(text));
}

public class ReviewedParserTests
{
    private const string Owner = "Gustavo Henrique da Fonseca";

    private static ParsedMerchant Parse(string description, string? owner = Owner) =>
        MerchantParser.Parse(description, TestRules.Default, owner)!;

    [Theory]
    [InlineData("MP *LOJADOZE", "Lojadoze")]
    [InlineData("MERCADOPAGO*FARMACIAPOP", "Farmaciapop")]
    [InlineData("PAGSEGURO*PADARIAREAL", "Padariareal")]
    [InlineData("IZ *CAFE DA ESQUINA", "Cafe da Esquina")]
    [InlineData("PICPAY*LOJA AZUL", "Loja Azul")]
    [InlineData("PADARIA PAO E CIA LTDA", "Padaria Pao e Cia")]
    [InlineData("LOJAS RENNER PARC 02/10", "Lojas Renner")]
    [InlineData("Casas Bahia - Parcela 3 de 12", "Casas Bahia")]
    [InlineData("NETSHOES 03 DE 05", "Netshoes")]
    public void Gateways_suffixes_and_installments_are_removed_from_the_name(string description, string name)
    {
        var parsed = Parse(description);

        Assert.Equal((name, MerchantKind.BUSINESS), (parsed.Name, parsed.Kind));
    }

    [Theory]
    [InlineData("Transferência enviada pelo Pix - JOSE DE SA", "Jose de Sa")]
    [InlineData("PIX TRANSF MARIA M19/10", "Maria M")]
    [InlineData("Pix enviado: \"Cp :18236120-MARIA MORAIS\"", "Maria Morais")]
    [InlineData("SISPAG PIX JOAO SILVA", "Joao Silva")]
    public void Bank_transfer_formats_name_the_person(string description, string name)
    {
        var parsed = Parse(description);

        Assert.Equal((name, MerchantKind.PERSON), (parsed.Name, parsed.Kind));
    }

    [Theory]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO H FONSECA - •••.123.456-•• - BCO INTER")]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO HENRIQUE DA FONS - •••.123.456-•• - ITAU")]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO HENRIQUE FONSECA - •••.123.456-•• - ITAU")]
    public void Own_transfers_are_recognised_with_initials_and_truncated_names(string description)
    {
        Assert.Equal(MerchantKind.OWN, Parse(description).Kind);
    }

    [Theory]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO H - •••.123.456-•• - BCO INTER")]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO SILVA - •••.123.456-•• - BCO INTER")]
    [InlineData("Transferência enviada pelo Pix - GUSTAVO FONSECA SILVA - •••.123.456-•• - BCO INTER")]
    [InlineData("Transferência enviada pelo Pix - JOAO HENRIQUE FONSECA - •••.123.456-•• - BCO INTER")]
    public void Other_people_with_similar_names_are_not_the_owner(string description)
    {
        Assert.Equal(MerchantKind.PERSON, Parse(description).Kind);
    }

    [Fact]
    public void An_owner_with_a_single_name_is_never_matched()
    {
        Assert.Equal(MerchantKind.PERSON, Parse("Transferência enviada pelo Pix - GUSTAVO H FONSECA - •••.123.456-•• - BCO", "Gustavo").Kind);
    }

    [Fact]
    public void Alphanumeric_cnpjs_mark_a_business()
    {
        var parsed = Parse("Transferência enviada pelo Pix - MERCADO BOM PRECO - 12.ABC.345/01DE-35 - BCO");

        Assert.Equal(("Mercado Bom Preco", MerchantKind.BUSINESS, "12.ABC.345/01DE-35"), (parsed.Name, parsed.Kind, parsed.Document));
    }

    [Theory]
    [InlineData("12.ABC.345/01DE-35", "12ABC34501DE35", false)]
    [InlineData("12.345.678/0001-90", "12345678000190", true)]
    [InlineData("12abc34501de35", "12ABC34501DE35", false)]
    [InlineData("12.ABC.345/01DE-3X", null, false)]
    [InlineData("•••.123.456-••", null, false)]
    [InlineData(null, null, false)]
    public void Cnpjs_can_be_alphanumeric_but_only_numeric_ones_are_looked_up(string? document, string? normalized, bool numeric)
    {
        Assert.Equal(normalized, Cnpj.Digits(document));
        if (normalized != null) Assert.Equal(numeric, Cnpj.IsNumeric(normalized));
    }
}
