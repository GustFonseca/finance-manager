using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Activity",
                table: "Merchants",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActivityCode",
                table: "Merchants",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EnrichedAt",
                table: "Merchants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.InsertData(
                table: "ClassificationRules",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Note", "Pattern", "Priority", "Type", "Value" },
                values: new object[,]
                {
                    { new Guid("c1a55100-0000-0000-0000-000000000049"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "restaurantes|lanchonetes|padaria|supermercados|hipermercados|minimercados|produtos alimenticios|bebidas|confeitaria", 490, "CATEGORY_HINT", "Alimentação" },
                    { new Guid("c1a55100-0000-0000-0000-000000000050"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "combustiveis|transporte rodoviario|transporte aereo|taxi|transporte por aplicativo|estacionamento", 500, "CATEGORY_HINT", "Transporte" },
                    { new Guid("c1a55100-0000-0000-0000-000000000051"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "energia eletrica|captacao tratamento e distribuicao de agua|telecomunicacoes|condominios|aluguel de imoveis|gas canalizado", 510, "CATEGORY_HINT", "Moradia" },
                    { new Guid("c1a55100-0000-0000-0000-000000000052"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "farmaceuticos|medic|odontolog|hospital|laboratorios clinicos|planos de saude|atividades de atencao a saude", 520, "CATEGORY_HINT", "Saúde" },
                    { new Guid("c1a55100-0000-0000-0000-000000000053"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "\\bensino\\b|educacao|treinamento|cursos", 530, "CATEGORY_HINT", "Educação" },
                    { new Guid("c1a55100-0000-0000-0000-000000000054"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "apostas|jogos de azar|loterias|cinema|espetaculos|recreacao|parques de diversao|esportivas|streaming", 540, "CATEGORY_HINT", "Lazer" },
                    { new Guid("c1a55100-0000-0000-0000-000000000055"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "energia eletrica|telecomunicacoes|condominios|planos de saude|seguros|administracao publica|\\bensino\\b", 550, "BILL", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000056"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "supermercados|hipermercados|minimercados|combustiveis|farmaceuticos|transporte rodoviario|taxi", 560, "GROCERY", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000057"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Atividade (CNAE)", "restaurantes|lanchonetes|bares|apostas|jogos de azar|loterias|cinema|espetaculos|vestuario|calcados|cosmeticos|perfumaria|tabacaria", 570, "SUPERFLUOUS", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000049"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000050"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000051"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000052"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000053"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000054"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000055"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000056"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000057"));

            migrationBuilder.DropColumn(
                name: "Activity",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "ActivityCode",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "EnrichedAt",
                table: "Merchants");
        }
    }
}
