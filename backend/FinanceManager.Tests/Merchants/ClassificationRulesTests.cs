using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Classification;

namespace FinanceManager.Tests.Merchants;

public class ClassificationRulesTests
{
    private static ClassificationRules With(params ClassificationRule[] extra) =>
        new([.. DefaultClassificationRules.All, .. extra]);

    [Fact]
    public void A_brand_added_to_the_table_is_recognized_without_code_changes()
    {
        const string description = "Transferência enviada pelo Pix - ZAMP SA BURGER KING - 13.574.594/0001-96 - BCO";
        Assert.NotEqual("Burger King", MerchantParser.Parse(description, TestRules.Default)!.Name);

        var rules = With(new ClassificationRule { Type = RuleType.BRAND, Pattern = @"burger king|\bzamp\b", Value = "Burger King" });

        var merchant = MerchantParser.Parse(description, rules)!;
        Assert.Equal("Burger King", merchant.Name);
        Assert.Equal("burgerking", merchant.Key);
    }

    [Fact]
    public void Own_money_and_category_classes_come_from_rows_too()
    {
        var rules = With(
            new ClassificationRule { Type = RuleType.OWN_MONEY, Pattern = "porquinho", Value = "Cofrinho" },
            new ClassificationRule { Type = RuleType.ESSENTIAL_CATEGORY, Pattern = "^pets$" });

        Assert.Equal(MerchantKind.OWN, MerchantParser.Parse("Porquinho guardado", rules)!.Kind);
        Assert.Equal(SpendingClass.ESSENTIAL, rules.CategoryClass("Pets"));
        Assert.Null(TestRules.Default.CategoryClass("Pets"));
    }

    [Fact]
    public void A_broken_pattern_is_skipped_and_reported_instead_of_failing()
    {
        var rules = With(new ClassificationRule { Type = RuleType.BRAND, Pattern = "(unclosed", Value = "X" });

        Assert.Single(rules.Problems);
        Assert.Equal("iFood", MerchantParser.Parse("Compra no débito via NuPay - iFood", rules)!.Name);
    }

    [Fact]
    public void An_inactive_rule_is_ignored()
    {
        var rules = new ClassificationRules(DefaultClassificationRules.All.Select(r => new ClassificationRule
        {
            Type = r.Type, Pattern = r.Pattern, Value = r.Value, Priority = r.Priority,
            IsActive = !(r.Type == RuleType.BRAND && r.Value == "iFood"),
        }));

        Assert.NotEqual("iFood", MerchantParser.Parse("Ifd*Pizzaria Bella", rules)!.Name);
    }
}
