using System.Text.RegularExpressions;

namespace FinanceManager.Aplication.Analysis;

/// <summary>
/// Kinds of merchants, matched on a description normalized by <see cref="MoneyText.Key"/>
/// (lower case, no accents, letters only). Shared by the recurring-charge detector and
/// the spending classifier.
/// </summary>
public static partial class MerchantPatterns
{
    /// <summary>Streaming, cloud, apps and gyms.</summary>
    [GeneratedRegex(@"netflix|spotify|disney|hbo|\bmax\b|prime video|amazon prime|youtube|deezer|globoplay|paramount|crunchyroll|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github")]
    public static partial Regex Subscriptions();

    /// <summary>Housing, utilities, insurance, schooling, loans and taxes.</summary>
    [GeneratedRegex(@"receita federal|simples nacional|darf|\binss\b|fgts|imposto|tributo|prefeitura|municipio|detran|cartorio|aluguel|condominio|imobiliaria|energia|enel|\blight\b|cemig|copel|celesc|sabesp|\bagua\b|comgas|internet|fibra|\bvivo\b|\bclaro\b|\btim\b|\bnet\b|iptu|ipva|seguro|plano de saude|unimed|amil|sulamerica|escola|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo")]
    public static partial Regex Bills();

    /// <summary>Needed, but the amount can be managed: groceries, fuel, pharmacy, transport.</summary>
    [GeneratedRegex(@"supermercado|mercado|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|posto|combustivel|gasolina|shell|ipiranga|petrobras|farmacia|drogaria|drogasil|\braia\b|pague menos|uber|\b99\b|cabify|metro|onibus|bilhete unico|estacionamento")]
    public static partial Regex Groceries();

    /// <summary>Delivery, eating out, entertainment, shopping and betting.</summary>
    [GeneratedRegex(@"ifood|rappi|ze delivery|delivery|aiqfome|uber eats|restaurante|lanchonete|\bbar\b|choperia|pizza|burger|mcdonald|\bbk\b|subway|starbucks|cafeteria|doceria|sorveteria|cinema|ingresso|\bshow\b|teatro|steam|shein|shopee|aliexpress|mercado livre|magalu|amazon|renner|riachuelo|\bzara\b|centauro|netshoes|boticario|sephora|perfumaria|\bbet\b|blaze|aposta")]
    public static partial Regex Superfluous();
}
