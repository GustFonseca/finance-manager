using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlistDebtsAndPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EmergencyGoalId",
                table: "SavingsPlans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmergencyMonths",
                table: "SavingsPlans",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Debts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BalanceCents = table.Column<long>(type: "bigint", nullable: false),
                    MonthlyRatePercent = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    MinimumPaymentCents = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Debts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Debts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WishlistItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PriceCents = table.Column<long>(type: "bigint", nullable: false),
                    Link = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DecideAfter = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DecidedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WishlistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WishlistItems_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ClassificationRules",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Note", "Pattern", "Priority", "Type", "Value" },
                values: new object[,]
                {
                    { new Guid("c1a55100-0000-0000-0000-000000000063"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bipva\\b|licenciamento|dpvat", 630, "SEASONAL", "IPVA e licenciamento" },
                    { new Guid("c1a55100-0000-0000-0000-000000000064"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\biptu\\b", 640, "SEASONAL", "IPTU" },
                    { new Guid("c1a55100-0000-0000-0000-000000000065"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "matricula|material escolar|rematricula", 650, "SEASONAL", "Matrícula e material escolar" },
                    { new Guid("c1a55100-0000-0000-0000-000000000066"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "seguro auto|seguro do carro|seguro residencial|seguro anual", 660, "SEASONAL", "Seguros anuais" },
                    { new Guid("c1a55100-0000-0000-0000-000000000067"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\banuidade\\b", 670, "SEASONAL", "Anuidades" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Debts_UserId",
                table: "Debts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WishlistItems_UserId",
                table: "WishlistItems",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Debts");

            migrationBuilder.DropTable(
                name: "WishlistItems");

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000063"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000064"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000065"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000066"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000067"));

            migrationBuilder.DropColumn(
                name: "EmergencyGoalId",
                table: "SavingsPlans");

            migrationBuilder.DropColumn(
                name: "EmergencyMonths",
                table: "SavingsPlans");
        }
    }
}
