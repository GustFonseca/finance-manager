using FinanceManager.Domain.Entities;
using FinanceManager.Infrastructure.Classification;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<StoredFile> Files => Set<StoredFile>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<SavingsPlan> SavingsPlans => Set<SavingsPlan>();
    public DbSet<CategoryBudget> CategoryBudgets => Set<CategoryBudget>();
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<ClassificationRule> ClassificationRules => Set<ClassificationRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.GoogleId).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Account>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => a.UserId);
            e.HasOne(a => a.User).WithMany(u => u.Accounts).HasForeignKey(a => a.UserId);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.UserId);
            e.Property(c => c.Type).HasConversion<string>();
            e.HasOne(c => c.User).WithMany(u => u.Categories).HasForeignKey(c => c.UserId);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => new { t.UserId, t.Date });
            e.Property(t => t.Type).HasConversion<string>();
            e.Property(t => t.Recurrence).HasConversion<string>();
            e.HasOne(t => t.User).WithMany(u => u.Transactions).HasForeignKey(t => t.UserId);
            e.HasOne(t => t.Account).WithMany(a => a.Transactions).HasForeignKey(t => t.AccountId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.Category).WithMany(c => c.Transactions).HasForeignKey(t => t.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(t => t.MerchantId);
            e.HasOne(t => t.Merchant).WithMany(m => m.Transactions).HasForeignKey(t => t.MerchantId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ClassificationRule>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.Type, r.Priority });
            e.Property(r => r.Type).HasConversion<string>().HasMaxLength(30);
            e.Property(r => r.Pattern).HasMaxLength(2000);
            e.Property(r => r.Value).HasMaxLength(100);
            e.Property(r => r.Note).HasMaxLength(300);
            e.HasData(DefaultClassificationRules.All);
        });

        modelBuilder.Entity<Merchant>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => new { m.UserId, m.Key }).IsUnique();
            e.Property(m => m.Name).HasMaxLength(100);
            e.Property(m => m.Key).HasMaxLength(100);
            e.Property(m => m.Document).HasMaxLength(30);
            e.Property(m => m.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.Class).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.ActivityCode).HasMaxLength(10);
            e.Property(m => m.Activity).HasMaxLength(300);
            e.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId);
            e.HasOne(m => m.Category).WithMany().HasForeignKey(m => m.CategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Goal>(e =>
        {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.UserId);
            e.Property(g => g.Status).HasConversion<string>();
            e.HasOne(g => g.User).WithMany(u => u.Goals).HasForeignKey(g => g.UserId);
        });

        modelBuilder.Entity<Folder>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.Property(f => f.Name).HasMaxLength(100);
            e.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId);
        });

        modelBuilder.Entity<StoredFile>(e =>
        {
            e.ToTable("Files");
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.HasIndex(f => f.FolderId);
            e.Property(f => f.Name).HasMaxLength(255);
            e.Property(f => f.ContentType).HasMaxLength(255);
            e.Property(f => f.StorageKey).HasMaxLength(100);
            e.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId);
            e.HasOne(f => f.Folder).WithMany(d => d.Files).HasForeignKey(f => f.FolderId);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.UserId, a.CreatedAt });
            e.Property(a => a.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Source).HasMaxLength(50);
            e.Property(a => a.Description).HasMaxLength(500);
            e.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId);
        });

        modelBuilder.Entity<SavingsPlan>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.UserId).IsUnique();
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId);
        });

        modelBuilder.Entity<CategoryBudget>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasIndex(b => new { b.UserId, b.CategoryId }).IsUnique();
            e.HasOne(b => b.User).WithMany().HasForeignKey(b => b.UserId);
            e.HasOne(b => b.Category).WithMany().HasForeignKey(b => b.CategoryId);
        });
    }
}
