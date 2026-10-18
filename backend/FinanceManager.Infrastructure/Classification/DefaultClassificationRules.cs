using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Infrastructure.Classification;

public static class DefaultClassificationRules
{
    private static readonly DateTime Seeded = new(2026, 10, 18, 0, 0, 0, DateTimeKind.Utc);
    private static int _sequence;

    public static readonly IReadOnlyList<ClassificationRule> All =
    [
        Rule(RuleType.OWN_MONEY, @"valor adicionado na conta por cartao de credito", "Crédito do cartão (Pix no crédito)", "Pix pago com o cartão: o crédito que entra na conta não é renda"),
        Rule(RuleType.OWN_MONEY, @"pagamento de fatura|pagamento recebido", "Fatura do cartão", "As compras vêm da fatura do cartão"),
        Rule(RuleType.OWN_MONEY, @"aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|resgate cdb|tesouro direto", "Investimentos"),
        Rule(RuleType.OWN_MONEY, @"(deposito|resgate) de emprestimo", "Empréstimo recebido", "Dinheiro emprestado não é renda"),

        Rule(RuleType.BRAND, @"\bifood\b|^ifd\b", "iFood"),
        Rule(RuleType.BRAND, @"\buber\b", "Uber"),
        Rule(RuleType.BRAND, @"^99\b|\b99 ?app\b|\b99 tecnologia\b|\b99 pop\b", "99"),
        Rule(RuleType.BRAND, @"\brappi\b", "Rappi"),
        Rule(RuleType.BRAND, @"\bshpp\b|\bshopee\b", "Shopee"),
        Rule(RuleType.BRAND, @"mercado ?livre|mercadolivre", "Mercado Livre"),
        Rule(RuleType.BRAND, @"mercado ?pago|^pix marketplace$|^mp\b", "Mercado Pago"),
        Rule(RuleType.BRAND, @"\bamazon\b|\bamzn\b", "Amazon"),
        Rule(RuleType.BRAND, @"\bnetflix\b", "Netflix"),
        Rule(RuleType.BRAND, @"\bspotify\b", "Spotify"),
        Rule(RuleType.BRAND, @"\bdisney\b", "Disney+"),
        Rule(RuleType.BRAND, @"\bapple\b|\bitunes\b", "Apple"),
        Rule(RuleType.BRAND, @"\bgoogle\b", "Google"),
        Rule(RuleType.BRAND, @"\bmicrosoft\b", "Microsoft"),
        Rule(RuleType.BRAND, @"\bpagseguro\b|\bpagbank\b", "PagBank"),
        Rule(RuleType.BRAND, @"\bpicpay\b", "PicPay"),
        Rule(RuleType.BRAND, @"^tim\b", "TIM"),
        Rule(RuleType.BRAND, @"^vivo\b|telefonica brasil", "Vivo"),
        Rule(RuleType.BRAND, @"^claro\b", "Claro"),
        Rule(RuleType.BRAND, @"receita federal", "Receita Federal"),

        Rule(RuleType.GATEWAY_PREFIX, @"ifd|mp|pg|pag|ec|pp|ppro|dl|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me"),

        Rule(RuleType.BUSINESS_WORD, @"\b(ltda|sa|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|ai|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao)\b"),

        Rule(RuleType.SUBSCRIPTION, @"netflix|spotify|disney|hbo|\bmax\b|prime video|amazon prime|youtube|deezer|globoplay|paramount|crunchyroll|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github"),
        Rule(RuleType.BILL, @"receita federal|simples nacional|darf|\binss\b|fgts|imposto|tributo|prefeitura|municipio|detran|cartorio", null, "Impostos e taxas"),
        Rule(RuleType.BILL, @"aluguel|condominio|imobiliaria|energia|enel|\blight\b|cemig|copel|celesc|sabesp|\bagua\b|comgas|internet|fibra|\bvivo\b|\bclaro\b|\btim\b|\bnet\b|iptu|ipva|seguro|plano de saude|unimed|amil|sulamerica|escola|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo"),
        Rule(RuleType.GROCERY, @"supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|posto|combustivel|gasolina|shell|ipiranga|petrobras|farmacia|drogaria|drogasil|\braia\b|pague menos|uber|\b99\b|cabify|metro|onibus|bilhete unico|estacionamento"),
        Rule(RuleType.SUPERFLUOUS, @"ifood|rappi|ze delivery|delivery|aiqfome|uber eats|restaurante|lanchonete|\bbar\b|choperia|pizza|burger|mcdonald|\bbk\b|subway|starbucks|cafeteria|doceria|sorveteria|cinema|ingresso|\bshow\b|teatro|steam|shein|shopee|aliexpress|mercado livre|magalu|amazon|renner|riachuelo|\bzara\b|centauro|netshoes|boticario|sephora|perfumaria|\bbet\b|blaze|aposta"),

        Rule(RuleType.CATEGORY_HINT, @"ifood|rappi|restaurante|lanchonete|padaria|panificadora|supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|\bbk\b|subway|\bcafe\b|confeitaria", "Alimentação"),
        Rule(RuleType.CATEGORY_HINT, @"uber|\b99\b|99app|cabify|posto|combustivel|gasolina|shell|ipiranga|petrobras|estacionamento|sem parar|veloe|conectcar|metro|onibus|bilhete unico", "Transporte"),
        Rule(RuleType.CATEGORY_HINT, @"aluguel|condominio|energia|enel|\blight\b|cemig|copel|sabesp|\bagua\b|comgas|internet|\bvivo\b|\bclaro\b|\btim\b|\bnet\b|iptu", "Moradia"),
        Rule(RuleType.CATEGORY_HINT, @"farmacia|drogaria|drogasil|\braia\b|pague menos|hospital|clinica|laboratorio|unimed|amil|odonto|academia|smart ?fit", "Saúde"),
        Rule(RuleType.CATEGORY_HINT, @"escola|faculdade|universidade|curso|udemy|alura|coursera|livraria|material escolar", "Educação"),
        Rule(RuleType.CATEGORY_HINT, @"netflix|spotify|disney|hbo|max com|prime video|youtube|cinema|ingresso|steam|playstation|xbox|nintendo|\bshow\b|teatro", "Lazer"),
        Rule(RuleType.CATEGORY_HINT, @"salario|folha de pagamento", "Salário"),
        Rule(RuleType.CATEGORY_HINT, @"rendimento|resgate|cdb|tesouro|dividendo|juros", "Investimentos"),

        Rule(RuleType.ESSENTIAL_CATEGORY, @"^(moradia|saude|educacao)$"),
        Rule(RuleType.SUPERFLUOUS_CATEGORY, @"^lazer$"),
        Rule(RuleType.CATCH_ALL_CATEGORY, @"^outros$"),
    ];

    private static ClassificationRule Rule(RuleType type, string pattern, string? value = null, string? note = null)
    {
        _sequence++;
        return new ClassificationRule
        {
            Id = Guid.Parse($"c1a55100-0000-0000-0000-{_sequence:D12}"),
            Type = type,
            Pattern = pattern,
            Value = value,
            Priority = _sequence * 10,
            IsActive = true,
            Note = note,
            CreatedAt = Seeded,
        };
    }
}
