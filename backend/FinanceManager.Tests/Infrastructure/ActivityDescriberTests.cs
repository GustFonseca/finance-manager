using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.Infrastructure;

public class ActivityDescriberTests
{
    private static readonly Guid Me = Guid.NewGuid();

    private readonly AppDbContext _db = TestDb.InMemory();

    private List<string> NewEntries(Action change)
    {
        var before = _db.ActivityLogs.Select(a => a.Id).ToHashSet();
        change();
        _db.SaveChanges();
        return _db.ActivityLogs.Where(a => !before.Contains(a.Id)).OrderBy(a => a.Description).Select(a => a.Description).ToList();
    }

    private T Saved<T>(T entity) where T : class
    {
        _db.Add(entity);
        _db.SaveChanges();
        return entity;
    }

    [Fact]
    public void Merchants_log_renames_and_kind_changes_but_not_new_ones()
    {
        var created = NewEntries(() => _db.Merchants.Add(new Merchant { UserId = Me, Name = "Toru", Key = "toru" }));
        var merchant = _db.Merchants.Single();

        var renamed = NewEntries(() => merchant.Name = "Toru Sushi");
        var kind = NewEntries(() => merchant.Kind = MerchantKind.PERSON);
        var category = NewEntries(() => merchant.CategoryId = Guid.NewGuid());

        Assert.Empty(created);
        Assert.Equal(["Estabelecimento renomeado: Toru → Toru Sushi"], renamed);
        Assert.Equal(["Estabelecimento atualizado: Toru Sushi"], kind);
        Assert.Empty(category);
    }

    [Fact]
    public void Categories_log_creation_renames_changes_and_deletion()
    {
        var created = NewEntries(() => _db.Categories.Add(new Category { UserId = Me, Name = "Pets", Type = CategoryType.EXPENSE }));
        var category = _db.Categories.Single();

        var renamed = NewEntries(() => category.Name = "Animais");
        var recolored = NewEntries(() => category.Color = "#FF0000");
        var retyped = NewEntries(() => category.Type = CategoryType.INCOME);
        var deleted = NewEntries(() => _db.Categories.Remove(category));

        Assert.Equal(["Categoria criada: Pets"], created);
        Assert.Equal(["Categoria renomeada: Pets → Animais"], renamed);
        Assert.Equal(["Categoria alterada: Animais"], recolored);
        Assert.Equal(["Categoria alterada: Animais"], retyped);
        Assert.Equal(["Categoria excluída: Animais"], deleted);
        Assert.Equal(ActivityType.WARNING, _db.ActivityLogs.Single(a => a.Description.StartsWith("Categoria excluída")).Type);
    }

    [Fact]
    public void Accounts_log_deletion_as_a_warning()
    {
        var account = Saved(new Account(Me, "Inter"));

        var deleted = NewEntries(() => _db.Accounts.Remove(account));

        Assert.Equal(["Conta excluída: Inter"], deleted);
    }

    [Fact]
    public void Goals_log_creation_deposits_completion_and_deletion()
    {
        var created = NewEntries(() => _db.Goals.Add(new Goal { UserId = Me, Name = "Viagem", TargetCents = 100000 }));
        var goal = _db.Goals.Single();

        var deposit = NewEntries(() => goal.CurrentCents = 25000);
        var completed = NewEntries(() =>
        {
            goal.CurrentCents = 100000;
            goal.Status = GoalStatus.COMPLETED;
        });
        var cancelled = NewEntries(() => goal.Status = GoalStatus.CANCELLED);
        var deleted = NewEntries(() => _db.Goals.Remove(goal));

        Assert.Single(created);
        Assert.StartsWith("Meta criada: Viagem (alvo R$", created[0]);
        Assert.Single(deposit);
        Assert.StartsWith("Valor adicionado à meta Viagem: R$", deposit[0]);
        Assert.Equal(2, completed.Count);
        Assert.Equal("Meta concluída: Viagem", completed[0]);
        Assert.Empty(cancelled);
        Assert.Equal(["Meta excluída: Viagem"], deleted);
    }

    [Fact]
    public void Folders_log_renames()
    {
        var folder = Saved(new Folder { UserId = Me, Name = "Notas" });

        var renamed = NewEntries(() => folder.Name = "Notas fiscais");

        Assert.Equal(["Pasta renomeada: Notas → Notas fiscais"], renamed);
    }

    [Fact]
    public void Files_log_moves_renames_trash_and_restore()
    {
        var source = Saved(new Folder { UserId = Me, Name = "Origem" });
        var target = Saved(new Folder { UserId = Me, Name = "Destino" });
        var file = Saved(new StoredFile { UserId = Me, FolderId = source.Id, Name = "a.pdf", StorageKey = "k" });

        var moved = NewEntries(() => file.FolderId = target.Id);
        var renamed = NewEntries(() => file.Name = "b.pdf");
        var trashed = NewEntries(() => file.DeletedAt = DateTime.UtcNow);
        var restored = NewEntries(() => file.DeletedAt = null);

        Assert.Equal(["Arquivo movido para Destino: a.pdf"], moved);
        Assert.Equal(["Arquivo renomeado: a.pdf → b.pdf"], renamed);
        Assert.Equal(["Arquivo enviado para a Lixeira: b.pdf"], trashed);
        Assert.Equal(["Arquivo restaurado da Lixeira: b.pdf"], restored);
    }

    [Fact]
    public void A_file_moved_to_an_untracked_folder_or_uploaded_without_one_is_still_described()
    {
        var uploaded = NewEntries(() => _db.Files.Add(new StoredFile { UserId = Me, FolderId = Guid.NewGuid(), Name = "grande.zip", SizeBytes = 5 * 1024 * 1024 + 300_000, StorageKey = "k" }));
        var file = _db.Files.Single();

        var moved = NewEntries(() => file.FolderId = Guid.NewGuid());

        Assert.Equal(["Arquivo enviado: grande.zip (5,3 MB)"], uploaded);
        Assert.Equal(["Arquivo movido para outra pasta: grande.zip"], moved);
    }

    [Fact]
    public void A_file_deleted_with_its_trashed_folder_is_not_logged_on_its_own()
    {
        var folder = Saved(new Folder { UserId = Me, Name = "Lixo", DeletedAt = DateTime.UtcNow });
        var file = Saved(new StoredFile { UserId = Me, FolderId = folder.Id, Name = "a.pdf", StorageKey = "k", DeletedAt = folder.DeletedAt });

        var deleted = NewEntries(() =>
        {
            _db.Files.Remove(file);
            _db.Folders.Remove(folder);
        });

        Assert.Equal(["Pasta excluída permanentemente: Lixo"], deleted);
    }

    [Fact]
    public void Savings_plans_log_only_goal_changes()
    {
        var created = NewEntries(() => _db.SavingsPlans.Add(new SavingsPlan { UserId = Me, MonthlyGoalCents = 50000 }));
        var plan = _db.SavingsPlans.Single();

        var changed = NewEntries(() => plan.MonthlyGoalCents = 80000);
        var touched = NewEntries(() => plan.UpdatedAt = DateTime.UtcNow.AddMinutes(1));

        Assert.Single(created);
        Assert.StartsWith("Meta de economia definida: R$", created[0]);
        Assert.Contains("800,00 por mês", Assert.Single(changed));
        Assert.Empty(touched);
    }

    [Fact]
    public void Budgets_name_their_category_when_it_is_known()
    {
        var lazer = Saved(new Category { UserId = Me, Name = "Lazer" });

        var created = NewEntries(() => _db.CategoryBudgets.Add(new CategoryBudget { UserId = Me, CategoryId = lazer.Id, LimitCents = 30000 }));
        var budget = _db.CategoryBudgets.Single();
        var changed = NewEntries(() => budget.LimitCents = 20000);
        var touched = NewEntries(() => budget.UpdatedAt = DateTime.UtcNow.AddMinutes(1));
        var removed = NewEntries(() => _db.CategoryBudgets.Remove(budget));
        var unknown = NewEntries(() => _db.CategoryBudgets.Add(new CategoryBudget { UserId = Me, CategoryId = Guid.NewGuid(), LimitCents = 100 }));

        Assert.Single(created);
        Assert.StartsWith("Orçamento de Lazer: R$", created[0]);
        Assert.Contains("200,00 por mês", Assert.Single(changed));
        Assert.Empty(touched);
        Assert.Equal(["Orçamento de Lazer removido"], removed);
        Assert.StartsWith("Orçamento de categoria:", Assert.Single(unknown));
    }

    [Fact]
    public void Untitled_transactions_and_very_long_descriptions_are_handled()
    {
        var untitled = NewEntries(() => _db.Transactions.Add(new Transaction { UserId = Me, Description = " ", Type = TransactionType.INCOME, AmountCents = 1000 }));
        var longOne = NewEntries(() => _db.Transactions.Add(new Transaction { UserId = Me, Description = new string('x', 600), Type = TransactionType.EXPENSE, AmountCents = 1000 }));

        Assert.StartsWith("Transação criada: (sem descrição) (+ R$", Assert.Single(untitled));
        var description = Assert.Single(longOne);
        Assert.Equal(ActivityDescriber.MaxDescriptionLength, description.Length);
        Assert.EndsWith("…", description);
    }

    [Fact]
    public void Entities_without_a_description_are_not_logged()
    {
        var entries = NewEntries(() => _db.Users.Add(new User { Name = "Ana", Email = "a@a.com", GoogleId = "g" }));

        Assert.Empty(entries);
    }
}
