using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChallengesWorkHoursAndFees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WorkHoursPerMonth",
                table: "SavingsPlans",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Challenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Scope = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TargetId = table.Column<Guid>(type: "uuid", nullable: true),
                    LimitCents = table.Column<long>(type: "bigint", nullable: false),
                    StartsOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Days = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Challenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Challenges_Users_UserId",
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
                    { new Guid("c1a55100-0000-0000-0000-000000000058"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\btarifa|pacote de servicos|cesta de servicos|manutencao de conta|taxa de saque|tarifa de saque", 580, "FEE", "Tarifas bancárias" },
                    { new Guid("c1a55100-0000-0000-0000-000000000059"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\banuidade", 590, "FEE", "Anuidade do cartão" },
                    { new Guid("c1a55100-0000-0000-0000-000000000060"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\biof\\b", 600, "FEE", "IOF" },
                    { new Guid("c1a55100-0000-0000-0000-000000000061"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bjuros|encargos|rotativo|\\bmora\\b|financiamento de fatura|parcelamento de fatura", 610, "FEE", "Juros e encargos" },
                    { new Guid("c1a55100-0000-0000-0000-000000000062"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bmulta", 620, "FEE", "Multas" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Challenges_UserId",
                table: "Challenges",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Challenges");

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000058"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000059"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000060"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000061"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000062"));

            migrationBuilder.DropColumn(
                name: "WorkHoursPerMonth",
                table: "SavingsPlans");
        }
    }
}
