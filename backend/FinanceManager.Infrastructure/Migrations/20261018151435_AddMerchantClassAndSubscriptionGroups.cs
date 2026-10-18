using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantClassAndSubscriptionGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Class",
                table: "Merchants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.InsertData(
                table: "ClassificationRules",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Note", "Pattern", "Priority", "Type", "Value" },
                values: new object[,]
                {
                    { new Guid("c1a55100-0000-0000-0000-000000000043"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "netflix|disney|hbo|\\bmax\\b|prime video|amazon prime|globoplay|paramount|crunchyroll|apple tv|youtube premium|star plus|telecine", 430, "SUBSCRIPTION_GROUP", "Streaming de vídeo" },
                    { new Guid("c1a55100-0000-0000-0000-000000000044"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "spotify|deezer|apple music|youtube music|tidal|amazon music", 440, "SUBSCRIPTION_GROUP", "Música" },
                    { new Guid("c1a55100-0000-0000-0000-000000000045"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "icloud|google one|dropbox|onedrive|mega", 450, "SUBSCRIPTION_GROUP", "Armazenamento em nuvem" },
                    { new Guid("c1a55100-0000-0000-0000-000000000046"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "chatgpt|openai|claude|anthropic|gemini|copilot|midjourney", 460, "SUBSCRIPTION_GROUP", "Inteligência artificial" },
                    { new Guid("c1a55100-0000-0000-0000-000000000047"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "smart ?fit|gympass|wellhub|totalpass|bluefit|academia", 470, "SUBSCRIPTION_GROUP", "Academia" },
                    { new Guid("c1a55100-0000-0000-0000-000000000048"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "xbox|playstation|nintendo|steam|game pass", 480, "SUBSCRIPTION_GROUP", "Jogos" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000043"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000044"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000045"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000046"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000047"));

            migrationBuilder.DeleteData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000048"));

            migrationBuilder.DropColumn(
                name: "Class",
                table: "Merchants");
        }
    }
}
