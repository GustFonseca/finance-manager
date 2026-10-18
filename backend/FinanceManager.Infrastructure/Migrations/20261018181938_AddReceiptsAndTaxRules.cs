using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceiptsAndTaxRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReceiptFileId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.InsertData(
                table: "ClassificationRules",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Note", "Pattern", "Priority", "Type", "Value" },
                values: new object[,]
                {
                    { new Guid("c1a55100-0000-0000-0000-000000000068"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Despesas médicas dedutíveis no IR", "\\bsaude\\b|medic|odontolog|dentista|hospital|clinica|laborator|psicolog|fisioterap|fonoaudiolog|terapia ocupacional|plano de saude|unimed|amil|bradesco saude|sulamerica saude|hapvida", 680, "TAX_DEDUCTIBLE", "Saúde" },
                    { new Guid("c1a55100-0000-0000-0000-000000000069"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Educação dedutível no IR, com limite anual por pessoa", "\\bensino\\b|educacao|escola|colegio|faculdade|universidade|pos graduacao|creche", 690, "TAX_DEDUCTIBLE", "Educação" },
                    { new Guid("c1a55100-0000-0000-0000-000000000070"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "PGBL é dedutível até 12% da renda tributável", "previdencia privada|\\bpgbl\\b", 700, "TAX_DEDUCTIBLE", "Previdência privada (PGBL)" },
                    { new Guid("c1a55100-0000-0000-0000-000000000071"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Pensão judicial é dedutível", "pensao alimenticia", 710, "TAX_DEDUCTIBLE", "Pensão alimentícia" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_ReceiptFileId",
                table: "Transactions",
                column: "ReceiptFileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Files_ReceiptFileId",
                table: "Transactions",
                column: "ReceiptFileId",
                principalTable: "Files",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Files_ReceiptFileId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_ReceiptFileId",
                table: "Transactions");

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000068"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000069"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000070"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000071"));

            migrationBuilder.DropColumn(
                name: "ReceiptFileId",
                table: "Transactions");
        }
    }
}
