using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClassificationRulesAndIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Accounts_AccountId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_Date",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions");

            migrationBuilder.CreateTable(
                name: "ClassificationRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Pattern = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Note = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassificationRules", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ClassificationRules",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Note", "Pattern", "Priority", "Type", "Value" },
                values: new object[,]
                {
                    { new Guid("c1a55100-0000-0000-0000-000000000001"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Pix pago com o cartão: o crédito que entra na conta não é renda", "valor adicionado na conta por cartao de credito", 10, "OWN_MONEY", "Crédito do cartão (Pix no crédito)" },
                    { new Guid("c1a55100-0000-0000-0000-000000000002"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "As compras vêm da fatura do cartão", "pagamento de fatura|pagamento recebido", 20, "OWN_MONEY", "Fatura do cartão" },
                    { new Guid("c1a55100-0000-0000-0000-000000000003"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|resgate cdb|tesouro direto", 30, "OWN_MONEY", "Investimentos" },
                    { new Guid("c1a55100-0000-0000-0000-000000000004"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dinheiro emprestado não é renda", "(deposito|resgate) de emprestimo", 40, "OWN_MONEY", "Empréstimo recebido" },
                    { new Guid("c1a55100-0000-0000-0000-000000000005"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bifood\\b|^ifd\\b", 50, "BRAND", "iFood" },
                    { new Guid("c1a55100-0000-0000-0000-000000000006"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\buber\\b", 60, "BRAND", "Uber" },
                    { new Guid("c1a55100-0000-0000-0000-000000000007"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^99\\b|\\b99 ?app\\b|\\b99 tecnologia\\b|\\b99 pop\\b", 70, "BRAND", "99" },
                    { new Guid("c1a55100-0000-0000-0000-000000000008"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\brappi\\b", 80, "BRAND", "Rappi" },
                    { new Guid("c1a55100-0000-0000-0000-000000000009"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bshpp\\b|\\bshopee\\b", 90, "BRAND", "Shopee" },
                    { new Guid("c1a55100-0000-0000-0000-000000000010"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "mercado ?livre|mercadolivre", 100, "BRAND", "Mercado Livre" },
                    { new Guid("c1a55100-0000-0000-0000-000000000011"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "mercado ?pago|^pix marketplace$|^mp\\b", 110, "BRAND", "Mercado Pago" },
                    { new Guid("c1a55100-0000-0000-0000-000000000012"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bamazon\\b|\\bamzn\\b", 120, "BRAND", "Amazon" },
                    { new Guid("c1a55100-0000-0000-0000-000000000013"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bnetflix\\b", 130, "BRAND", "Netflix" },
                    { new Guid("c1a55100-0000-0000-0000-000000000014"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bspotify\\b", 140, "BRAND", "Spotify" },
                    { new Guid("c1a55100-0000-0000-0000-000000000015"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bdisney\\b", 150, "BRAND", "Disney+" },
                    { new Guid("c1a55100-0000-0000-0000-000000000016"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bapple\\b|\\bitunes\\b", 160, "BRAND", "Apple" },
                    { new Guid("c1a55100-0000-0000-0000-000000000017"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bgoogle\\b", 170, "BRAND", "Google" },
                    { new Guid("c1a55100-0000-0000-0000-000000000018"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bmicrosoft\\b", 180, "BRAND", "Microsoft" },
                    { new Guid("c1a55100-0000-0000-0000-000000000019"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bpagseguro\\b|\\bpagbank\\b", 190, "BRAND", "PagBank" },
                    { new Guid("c1a55100-0000-0000-0000-000000000020"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\bpicpay\\b", 200, "BRAND", "PicPay" },
                    { new Guid("c1a55100-0000-0000-0000-000000000021"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^tim\\b", 210, "BRAND", "TIM" },
                    { new Guid("c1a55100-0000-0000-0000-000000000022"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^vivo\\b|telefonica brasil", 220, "BRAND", "Vivo" },
                    { new Guid("c1a55100-0000-0000-0000-000000000023"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^claro\\b", 230, "BRAND", "Claro" },
                    { new Guid("c1a55100-0000-0000-0000-000000000024"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "receita federal", 240, "BRAND", "Receita Federal" },
                    { new Guid("c1a55100-0000-0000-0000-000000000025"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "ifd|mp|pg|pag|ec|pp|ppro|dl|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me", 250, "GATEWAY_PREFIX", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000026"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "\\b(ltda|sa|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|ai|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao)\\b", 260, "BUSINESS_WORD", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000027"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "netflix|spotify|disney|hbo|\\bmax\\b|prime video|amazon prime|youtube|deezer|globoplay|paramount|crunchyroll|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github", 270, "SUBSCRIPTION", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000028"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, "Impostos e taxas", "receita federal|simples nacional|darf|\\binss\\b|fgts|imposto|tributo|prefeitura|municipio|detran|cartorio", 280, "BILL", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000029"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "aluguel|condominio|imobiliaria|energia|enel|\\blight\\b|cemig|copel|celesc|sabesp|\\bagua\\b|comgas|internet|fibra|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu|ipva|seguro|plano de saude|unimed|amil|sulamerica|escola|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo", 290, "BILL", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000030"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|posto|combustivel|gasolina|shell|ipiranga|petrobras|farmacia|drogaria|drogasil|\\braia\\b|pague menos|uber|\\b99\\b|cabify|metro|onibus|bilhete unico|estacionamento", 300, "GROCERY", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000031"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "ifood|rappi|ze delivery|delivery|aiqfome|uber eats|restaurante|lanchonete|\\bbar\\b|choperia|pizza|burger|mcdonald|\\bbk\\b|subway|starbucks|cafeteria|doceria|sorveteria|cinema|ingresso|\\bshow\\b|teatro|steam|shein|shopee|aliexpress|mercado livre|magalu|amazon|renner|riachuelo|\\bzara\\b|centauro|netshoes|boticario|sephora|perfumaria|\\bbet\\b|blaze|aposta", 310, "SUPERFLUOUS", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000032"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "ifood|rappi|restaurante|lanchonete|padaria|panificadora|supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|\\bbk\\b|subway|\\bcafe\\b|confeitaria", 320, "CATEGORY_HINT", "Alimentação" },
                    { new Guid("c1a55100-0000-0000-0000-000000000033"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "uber|\\b99\\b|99app|cabify|posto|combustivel|gasolina|shell|ipiranga|petrobras|estacionamento|sem parar|veloe|conectcar|metro|onibus|bilhete unico", 330, "CATEGORY_HINT", "Transporte" },
                    { new Guid("c1a55100-0000-0000-0000-000000000034"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "aluguel|condominio|energia|enel|\\blight\\b|cemig|copel|sabesp|\\bagua\\b|comgas|internet|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu", 340, "CATEGORY_HINT", "Moradia" },
                    { new Guid("c1a55100-0000-0000-0000-000000000035"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "farmacia|drogaria|drogasil|\\braia\\b|pague menos|hospital|clinica|laboratorio|unimed|amil|odonto|academia|smart ?fit", 350, "CATEGORY_HINT", "Saúde" },
                    { new Guid("c1a55100-0000-0000-0000-000000000036"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "escola|faculdade|universidade|curso|udemy|alura|coursera|livraria|material escolar", 360, "CATEGORY_HINT", "Educação" },
                    { new Guid("c1a55100-0000-0000-0000-000000000037"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "netflix|spotify|disney|hbo|max com|prime video|youtube|cinema|ingresso|steam|playstation|xbox|nintendo|\\bshow\\b|teatro", 370, "CATEGORY_HINT", "Lazer" },
                    { new Guid("c1a55100-0000-0000-0000-000000000038"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "salario|folha de pagamento", 380, "CATEGORY_HINT", "Salário" },
                    { new Guid("c1a55100-0000-0000-0000-000000000039"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "rendimento|resgate|cdb|tesouro|dividendo|juros", 390, "CATEGORY_HINT", "Investimentos" },
                    { new Guid("c1a55100-0000-0000-0000-000000000040"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^(moradia|saude|educacao)$", 400, "ESSENTIAL_CATEGORY", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000041"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^lazer$", 410, "SUPERFLUOUS_CATEGORY", null },
                    { new Guid("c1a55100-0000-0000-0000-000000000042"), new DateTime(2026, 10, 18, 0, 0, 0, 0, DateTimeKind.Utc), true, null, "^outros$", 420, "CATCH_ALL_CATEGORY", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_Date",
                table: "Transactions",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationRules_Type_Priority",
                table: "ClassificationRules",
                columns: new[] { "Type", "Priority" });

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Accounts_AccountId",
                table: "Transactions",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Accounts_AccountId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "ClassificationRules");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_Date",
                table: "Transactions");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Date",
                table: "Transactions",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Accounts_AccountId",
                table: "Transactions",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
