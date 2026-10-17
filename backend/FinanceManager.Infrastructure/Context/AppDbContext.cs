using FinanceManager.Domain.Entities;
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.GoogleId).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        // Account
        modelBuilder.Entity<Account>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => a.UserId);
            e.HasOne(a => a.User).WithMany(u => u.Accounts).HasForeignKey(a => a.UserId);
        });

        // Category
        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.UserId);
            e.Property(c => c.Type).HasConversion<string>();
            e.HasOne(c => c.User).WithMany(u => u.Categories).HasForeignKey(c => c.UserId);
        });

        // Transaction
        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.Date);
            e.Property(t => t.Type).HasConversion<string>();
            e.Property(t => t.Recurrence).HasConversion<string>();
            e.HasOne(t => t.User).WithMany(u => u.Transactions).HasForeignKey(t => t.UserId);
            e.HasOne(t => t.Account).WithMany(a => a.Transactions).HasForeignKey(t => t.AccountId);
            e.HasOne(t => t.Category).WithMany(c => c.Transactions).HasForeignKey(t => t.CategoryId);
        });

        // Goal
        modelBuilder.Entity<Goal>(e =>
        {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.UserId);
            e.Property(g => g.Status).HasConversion<string>();
            e.HasOne(g => g.User).WithMany(u => u.Goals).HasForeignKey(g => g.UserId);
        });

        // Folder
        modelBuilder.Entity<Folder>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.Property(f => f.Name).HasMaxLength(100);
            e.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId);
        });

        // StoredFile
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

        // ActivityLog
        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasKey(a => a.Id);
            // The event viewer always reads one user's entries, newest first.
            e.HasIndex(a => new { a.UserId, a.CreatedAt });
            e.Property(a => a.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Source).HasMaxLength(50);
            e.Property(a => a.Description).HasMaxLength(500);
            e.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId);
        });
    }
}
