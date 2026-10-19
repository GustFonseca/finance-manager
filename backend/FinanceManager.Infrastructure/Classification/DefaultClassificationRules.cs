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
        Rule(RuleType.OWN_MONEY, @"pag(amento|to)? (de )?fatura|pgto (de )?fatura|^pagamento recebido$", "Fatura do cartão", "As compras vêm da fatura do cartão"),
        Rule(RuleType.OWN_MONEY, @"aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|\baplic\b|resgate (cdb|rdb|invest)|invest facil|cofrinho|tesouro direto", "Investimentos"),
        Rule(RuleType.OWN_MONEY, @"(deposito|resgate) de emprestimo", "Empréstimo recebido", "Dinheiro emprestado não é renda"),

        Rule(RuleType.BRAND, @"\bifood\b|^ifd\b", "iFood"),
        Rule(RuleType.BRAND, @"\buber\b", "Uber"),
        Rule(RuleType.BRAND, @"^99\b|\b99 ?app\b|\b99 tecnologia\b|\b99 pop\b", "99"),
        Rule(RuleType.BRAND, @"\brappi\b", "Rappi"),
        Rule(RuleType.BRAND, @"\bshpp\b|\bshopee\b", "Shopee"),
        Rule(RuleType.BRAND, @"mercado ?livre|mercadolivre", "Mercado Livre"),
        Rule(RuleType.BRAND, @"^mercado ?pago$|^mercado ?pago (instituicao|ip|ltda)\b|^pix marketplace$", "Mercado Pago"),
        Rule(RuleType.BRAND, @"\bamazon|\bamzn\b", "Amazon"),
        Rule(RuleType.BRAND, @"\bnetflix\b", "Netflix"),
        Rule(RuleType.BRAND, @"\bspotify\b", "Spotify"),
        Rule(RuleType.BRAND, @"\bdisney", "Disney+"),
        Rule(RuleType.BRAND, @"\bapple\b|\bitunes\b", "Apple"),
        Rule(RuleType.BRAND, @"\bgoogle\b", "Google"),
        Rule(RuleType.BRAND, @"\bmicrosoft\b", "Microsoft"),
        Rule(RuleType.BRAND, @"^pagseguro( internet| ltda| sa)?$|\bpagbank\b", "PagBank"),
        Rule(RuleType.BRAND, @"^picpay( servicos| instituicao de pagamento)?( s a| sa| ltda)?$", "PicPay"),
        Rule(RuleType.BRAND, @"^tim\b", "TIM"),
        Rule(RuleType.BRAND, @"^vivo\b|telefonica brasil", "Vivo"),
        Rule(RuleType.BRAND, @"^claro\b", "Claro"),
        Rule(RuleType.BRAND, @"receita federal", "Receita Federal"),

        Rule(RuleType.GATEWAY_PREFIX, @"ifd|mp|pg|pag|ec|pp|ppro|dl|dlo|dm|iz|sq|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me|mercado ?pago|pagseguro|picpay|nupay|kiwify|hna"),

        Rule(RuleType.BUSINESS_WORD, @"\b(ltda|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao|eireli|epp|mei)\b"),

        Rule(RuleType.SUBSCRIPTION, @"netflix|spotify|disney|hbo|\bmax com\b|^max$|prime video|amazon ?prime|youtube|deezer|globoplay|paramount|crunchyroll|telecine|\bmubi\b|kindle|audible|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|claude ai|anthropic|duolingo|tinder|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github"),
        Rule(RuleType.BILL, @"receita federal|simples nacional|darf|\binss\b|fgts|imposto|tributo|prefeitura|municipio|detran|cartorio", null, "Impostos e taxas"),
        Rule(RuleType.BILL, @"aluguel|condominio|imobiliaria|(?<!vibra )energia|\benel\b|\blight\b|cemig|copel|celesc|sabesp|cedae|copasa|embasa|sanepar|caesb|compesa|cagece|casan|corsan|saneago|cpfl|energisa|equatorial|neoenergia|elektro|\bagua\b(?! (mineral|de coco))|comgas|naturgy|(?<!na )internet|fibra|\bsky\b|\boi\b|\bvivo\b|\bclaro\b|\btim\b|\bnet\b|iptu|ipva|(?<!pag)seguro|plano de saude|unimed|\bamil\b|hapvida|notredame|sulamerica|\bescola\b|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo"),
        Rule(RuleType.GROCERY, @"supermercado|\bmercad(inho|o\b)(?! ?(pago|livre|bitcoin))|mercearia|\bhiper|\bextra\b|^dia\b|sams club|savegnago|zaffari|muffato|condor|bistek|angeloni|\bsonda\b|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|\bposto\b|combustive|gasolina|shell|ipiranga|petrobras|abastece|farmacia|\bfarma|droga|panvel|pacheco|\braia\b|pague menos|\buber\b(?! ?eats)|^99\b|\b99 ?(app|pop|tecnologia)\b|cabify|\bmetro\b|onibus|bilhete unico|estacionamento|sem parar|veloe|conectcar"),
        Rule(RuleType.SUPERFLUOUS, @"ifood|rappi|ze delivery|delivery|aiqfome|uber ?eats|restaurante|lanchonete|\bbar\b|choperia|pizza|burger|mcdonald|\bbk\b|subway|starbucks|cafeteria|doceria|sorveteria|outback|habib|coco bambu|madero|giraffas|\bkfc\b|\bbobs\b|spoleto|cinema|ingresso|\bshow\b|teatro|steam|shein|shopee|aliexpress|mercado ?livre|magalu|magazine luiza|casas bahia|kabum|amazon|renner|riachuelo|\bzara\b|centauro|netshoes|boticario|sephora|perfumaria|\bbet\b|\w+bet\b|\bbet ?\d+|betano|betnacional|esportes da sorte|\bkto\b|blaze|aposta"),

        Rule(RuleType.CATEGORY_HINT, @"ifood|rappi|uber ?eats|ze delivery|aiqfome|restaurante|lanchonete|padaria|panificadora|supermercado|\bmercad(inho|o\b)(?! ?(pago|livre|bitcoin))|mercearia|\bhiper|\bextra\b|^dia\b|sams club|savegnago|zaffari|muffato|condor|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|\bbk\b|subway|starbucks|outback|habib|coco bambu|madero|giraffas|\bkfc\b|\bbobs\b|\bcafe\b|confeitaria", "Alimentação"),
        Rule(RuleType.CATEGORY_HINT, @"\buber\b|^99\b|\b99 ?(app|pop|tecnologia)\b|cabify|\bposto\b|combustive|gasolina|shell|ipiranga|petrobras|abastece|estacionamento|sem parar|veloe|conectcar|\bmetro\b|onibus|bilhete unico", "Transporte"),
        Rule(RuleType.CATEGORY_HINT, @"aluguel|condominio|(?<!vibra )energia|\benel\b|\blight\b|cemig|copel|sabesp|cedae|copasa|embasa|sanepar|cpfl|energisa|equatorial|neoenergia|\bagua\b(?! (mineral|de coco))|comgas|(?<!na )internet|fibra|\bsky\b|\boi\b|\bvivo\b|\bclaro\b|\btim\b|\bnet\b|iptu", "Moradia"),
        Rule(RuleType.CATEGORY_HINT, @"farmacia|\bfarma|droga|panvel|pacheco|\braia\b|pague menos|hospital|clinica|laboratorio|unimed|\bamil\b|hapvida|odonto|academia|smart ?fit|gympass|wellhub|totalpass", "Saúde"),
        Rule(RuleType.CATEGORY_HINT, @"escola|colegio|faculdade|universidade|curso|udemy|alura|coursera|duolingo|livraria|material escolar", "Educação"),
        Rule(RuleType.CATEGORY_HINT, @"netflix|spotify|disney|hbo|max com|^max$|prime video|amazon ?prime|youtube|globoplay|paramount|deezer|crunchyroll|telecine|\bmubi\b|cinema|ingresso|steam|playstation|xbox|nintendo|\bshow\b|teatro|\bbet\b|\w+bet\b|\bbet ?\d+|betano|esportes da sorte|blaze|aposta", "Lazer"),
        Rule(RuleType.CATEGORY_HINT, @"salario|folha de pagamento", "Salário"),
        Rule(RuleType.CATEGORY_HINT, @"rendimento|\bcdb\b|tesouro|dividendo|juros sobre capital|\bjcp\b", "Investimentos"),

        Rule(RuleType.ESSENTIAL_CATEGORY, @"^(moradia|saude|educacao)$"),
        Rule(RuleType.SUPERFLUOUS_CATEGORY, @"^lazer$"),
        Rule(RuleType.CATCH_ALL_CATEGORY, @"^outros$"),

        Rule(RuleType.SUBSCRIPTION_GROUP, @"netflix|disney|hbo|\bmax com\b|^max$|prime video|amazon ?prime|globoplay|paramount|crunchyroll|apple tv|youtube ?premium|star ?plus|telecine|\bmubi\b", "Streaming de vídeo"),
        Rule(RuleType.SUBSCRIPTION_GROUP, @"spotify|deezer|apple music|youtube music|tidal|amazon music", "Música"),
        Rule(RuleType.SUBSCRIPTION_GROUP, @"icloud|google one|dropbox|onedrive|mega", "Armazenamento em nuvem"),
        Rule(RuleType.SUBSCRIPTION_GROUP, @"chatgpt|openai|claude|anthropic|gemini|copilot|midjourney", "Inteligência artificial"),
        Rule(RuleType.SUBSCRIPTION_GROUP, @"smart ?fit|gympass|wellhub|totalpass|bluefit|academia", "Academia"),
        Rule(RuleType.SUBSCRIPTION_GROUP, @"xbox|playstation|nintendo|steam|game pass", "Jogos"),

        Rule(RuleType.CATEGORY_HINT, @"restaurantes|lanchonetes|padaria|supermercados|hipermercados|minimercados|produtos alimenticios|bebidas|confeitaria", "Alimentação", "Atividade (CNAE)"),
        Rule(RuleType.CATEGORY_HINT, @"combustiveis|transporte rodoviario|transporte aereo|taxi|transporte por aplicativo|estacionamento", "Transporte", "Atividade (CNAE)"),
        Rule(RuleType.CATEGORY_HINT, @"energia eletrica|captacao tratamento e distribuicao de agua|telecomunicacoes|telefonia|comunicacao multimidia|televisao por assinatura|condominios|aluguel de imoveis|gas canalizado|gas liquefeito", "Moradia", "Atividade (CNAE)"),
        Rule(RuleType.CATEGORY_HINT, @"farmaceuticos|medic|odontolog|hospital|laboratorios clinicos|planos de saude|atividades de atencao a saude|condicionamento fisico", "Saúde", "Atividade (CNAE)"),
        Rule(RuleType.CATEGORY_HINT, @"\bensino\b|educacao|treinamento|cursos", "Educação", "Atividade (CNAE)"),
        Rule(RuleType.CATEGORY_HINT, @"apostas|jogos de azar|loterias|cinema|espetaculos|recreacao|parques de diversao|esportivas|streaming", "Lazer", "Atividade (CNAE)"),
        Rule(RuleType.BILL, @"energia eletrica|telecomunicacoes|telefonia|comunicacao multimidia|televisao por assinatura|condominios|planos de saude|seguros|administracao publica|\bensino\b(?! de (idiomas|esportes|arte))", null, "Atividade (CNAE)"),
        Rule(RuleType.GROCERY, @"supermercados|hipermercados|minimercados|combustiveis|farmaceuticos|transporte rodoviario|taxi", null, "Atividade (CNAE)"),
        Rule(RuleType.SUPERFLUOUS, @"restaurantes|lanchonetes|bares|apostas|jogos de azar|loterias|cinema|espetaculos|vestuario|calcados|cosmeticos|perfumaria|tabacaria", null, "Atividade (CNAE)"),

        Rule(RuleType.FEE, @"\btarifa|\btar\b|pacote de servicos|cesta de servicos|manutencao de conta|taxa de saque|tarifa de saque", "Tarifas bancárias"),
        Rule(RuleType.FEE, @"\banuidade", "Anuidade do cartão"),
        Rule(RuleType.FEE, @"\biof\b", "IOF"),
        Rule(RuleType.FEE, @"\bjuros|\bencargos?\b|rotativo|\bmora\b|financiamento de fatura|parcelamento de fatura", "Juros e encargos"),
        Rule(RuleType.FEE, @"\bmulta", "Multas"),

        Rule(RuleType.SEASONAL, @"\bipva\b|licenciamento|dpvat", "IPVA e licenciamento"),
        Rule(RuleType.SEASONAL, @"\biptu\b", "IPTU"),
        Rule(RuleType.SEASONAL, @"matricula|material escolar|rematricula", "Matrícula e material escolar"),
        Rule(RuleType.SEASONAL, @"seguro auto|seguro do carro|seguro residencial|seguro anual", "Seguros anuais"),
        Rule(RuleType.SEASONAL, @"\banuidade\b", "Anuidades"),

        Rule(RuleType.TAX_DEDUCTIBLE, @"\bmedic(?!amento)(?!.*veterinari)|odontolog|dentista|hospital(?! veterinario)|clinica(?! (veterinaria|de estetica|estetica))|laborator|psicolog|fisioterap|fonoaudiolog|terapia ocupacional|plano de saude|unimed|\bamil\b|bradesco saude|sulamerica saude|hapvida", "Saúde", "Despesas médicas dedutíveis no IR"),
        Rule(RuleType.TAX_DEDUCTIBLE, @"\bensino\b(?! de (idiomas|esportes|arte))|educacao (infantil|superior|basica|profissional)|\bescola\b|colegio|faculdade|universidade|pos graduacao|creche", "Educação", "Educação dedutível no IR, com limite anual por pessoa"),
        Rule(RuleType.TAX_DEDUCTIBLE, @"previdencia privada|\bpgbl\b", "Previdência privada (PGBL)", "PGBL é dedutível até 12% da renda tributável"),
        Rule(RuleType.TAX_DEDUCTIBLE, @"pensao alimenticia", "Pensão alimentícia", "Pensão judicial é dedutível"),
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
