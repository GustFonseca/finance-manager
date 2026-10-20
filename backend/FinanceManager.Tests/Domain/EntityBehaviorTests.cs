using FinanceManager.Domain.Common;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Events;

namespace FinanceManager.Tests.Domain;

public class EntityBehaviorTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void An_account_records_and_reverses_income_and_expenses()
    {
        var account = new Account(Guid.NewGuid(), "Nubank");
        var salary = new Transaction { Type = TransactionType.INCOME, AmountCents = 500000 };
        var rent = new Transaction { Type = TransactionType.EXPENSE, AmountCents = 150000 };

        account.Record(salary);
        account.Record(rent);
        Assert.Equal(350000, account.BalanceCents);

        var version = account.Version;
        account.Reverse(rent);
        Assert.Equal(500000, account.BalanceCents);
        Assert.NotEqual(version, account.Version);
        Assert.Equal((500000, -150000), (salary.SignedAmountCents, rent.SignedAmountCents));
    }

    [Fact]
    public void A_goal_completes_itself_when_the_target_is_reached_and_rejects_progress_afterwards()
    {
        var goal = new Goal { TargetCents = 1000 };

        goal.AddProgress(333);
        Assert.Equal((33.3, GoalStatus.ACTIVE), (goal.ProgressPercent, goal.Status));

        goal.AddProgress(700);
        Assert.Equal((103.3, GoalStatus.COMPLETED), (goal.ProgressPercent, goal.Status));

        var error = Assert.Throws<DomainException>(() => goal.AddProgress(1));
        Assert.Equal("A meta não está ativa.", error.Message);
        Assert.Equal(0, new Goal().ProgressPercent);
    }

    [Fact]
    public void A_goal_can_be_completed_by_hand()
    {
        var goal = new Goal { TargetCents = 1000 };

        goal.Complete();

        Assert.Equal(GoalStatus.COMPLETED, goal.Status);
    }

    [Fact]
    public void A_user_counts_logins_and_records_activity_at_most_once_per_gap()
    {
        var user = new User();

        user.RecordLogin(Now);
        user.RecordLogin(Now.AddDays(1));

        Assert.Equal(((DateTime?)Now.AddDays(1), (DateTime?)Now.AddDays(1), 2), (user.LastLoginAt, user.LastSeenAt, user.LoginCount));
        Assert.False(user.RecordActivity(Now.AddDays(1).AddMinutes(30), TimeSpan.FromHours(1)));
        Assert.True(user.RecordActivity(Now.AddDays(1).AddHours(1), TimeSpan.FromHours(1)));
        Assert.Equal(Now.AddDays(1).AddHours(1), user.LastSeenAt);
        Assert.True(new User().RecordActivity(Now, TimeSpan.FromHours(1)));
    }

    [Fact]
    public void Every_real_change_to_a_classification_rule_is_announced()
    {
        var rule = ClassificationRule.Create(RuleType.BRAND, "toru", "Toru", 5, "Marca");

        rule.Change(RuleType.SUPERFLUOUS, @"\bbar\b", null, 1, null);
        Assert.False(rule.SetActive(true));
        Assert.True(rule.SetActive(false));

        Assert.Equal((RuleType.SUPERFLUOUS, @"\bbar\b", (string?)null, 1, (string?)null, false), (rule.Type, rule.Pattern, rule.Value, rule.Priority, rule.Note, rule.IsActive));
        Assert.Equal(Enumerable.Repeat<IDomainEvent>(new ClassificationRulesChanged(rule.Id), 3), rule.DomainEvents);

        rule.ClearDomainEvents();
        Assert.Empty(rule.DomainEvents);
    }

    [Fact]
    public void Purging_a_file_announces_the_object_to_remove_from_storage()
    {
        var file = new StoredFile { StorageKey = "u/f" };

        file.Purge();

        Assert.Equal([new StoredFilePurged(file.Id, "u/f")], file.DomainEvents);
    }

    [Fact]
    public void Applying_the_company_activity_enriches_the_merchant_and_announces_it()
    {
        var merchant = new Merchant { UserId = Guid.NewGuid() };

        merchant.ApplyActivity("5611201", "Restaurantes", Now);

        Assert.Equal(("5611201", "Restaurantes", (DateTime?)Now), (merchant.ActivityCode, merchant.Activity, merchant.EnrichedAt));
        Assert.Equal([new MerchantEnriched(merchant.Id, merchant.UserId)], merchant.DomainEvents);
    }
}
