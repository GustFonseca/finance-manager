using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReviewHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CatalogAttemptedAt",
                table: "Transactions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnrichmentAttempts",
                table: "Merchants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""UPDATE "Goals" SET "Name" = LEFT("Name", 100) WHERE LENGTH("Name") > 100;""");
            migrationBuilder.Sql("""UPDATE "Categories" SET "Name" = LEFT("Name", 100) WHERE LENGTH("Name") > 100;""");
            migrationBuilder.Sql("""UPDATE "Categories" SET "Color" = '#888888' WHERE "Color" !~ '^#[0-9A-Fa-f]{6}$';""");
            migrationBuilder.Sql("""UPDATE "Accounts" SET "Name" = LEFT("Name", 100) WHERE LENGTH("Name") > 100;""");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "Categories",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Accounts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Accounts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000002"),
                column: "Pattern",
                value: "pag(amento|to)? (de )?fatura|pgto (de )?fatura|^pagamento recebido$");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000003"),
                column: "Pattern",
                value: "aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|\\baplic\\b|resgate (cdb|rdb|invest)|invest facil|cofrinho|tesouro direto");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000011"),
                column: "Pattern",
                value: "^mercado ?pago$|^mercado ?pago (instituicao|ip|ltda)\\b|^pix marketplace$");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000012"),
                column: "Pattern",
                value: "\\bamazon|\\bamzn\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000015"),
                column: "Pattern",
                value: "\\bdisney");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000019"),
                column: "Pattern",
                value: "^pagseguro( internet| ltda| sa)?$|\\bpagbank\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000020"),
                column: "Pattern",
                value: "^picpay( servicos| instituicao de pagamento)?( s a| sa| ltda)?$");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000025"),
                column: "Pattern",
                value: "ifd|mp|pg|pag|ec|pp|ppro|dl|dlo|dm|iz|sq|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me|mercado ?pago|pagseguro|picpay|nupay|kiwify|hna");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000026"),
                column: "Pattern",
                value: "\\b(ltda|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao|eireli|epp|mei)\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000027"),
                column: "Pattern",
                value: "netflix|spotify|disney|hbo|\\bmax com\\b|^max$|prime video|amazon ?prime|youtube|deezer|globoplay|paramount|crunchyroll|telecine|\\bmubi\\b|kindle|audible|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|claude ai|anthropic|duolingo|tinder|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000029"),
                column: "Pattern",
                value: "aluguel|condominio|imobiliaria|(?<!vibra )energia|\\benel\\b|\\blight\\b|cemig|copel|celesc|sabesp|cedae|copasa|embasa|sanepar|caesb|compesa|cagece|casan|corsan|saneago|cpfl|energisa|equatorial|neoenergia|elektro|\\bagua\\b(?! (mineral|de coco))|comgas|naturgy|(?<!na )internet|fibra|\\bsky\\b|\\boi\\b|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu|ipva|(?<!pag)seguro|plano de saude|unimed|\\bamil\\b|hapvida|notredame|sulamerica|\\bescola\\b|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000030"),
                column: "Pattern",
                value: "supermercado|\\bmercad(inho|o\\b)(?! ?(pago|livre|bitcoin))|mercearia|\\bhiper|\\bextra\\b|^dia\\b|sams club|savegnago|zaffari|muffato|condor|bistek|angeloni|\\bsonda\\b|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|\\bposto\\b|combustive|gasolina|shell|ipiranga|petrobras|abastece|farmacia|\\bfarma|droga|panvel|pacheco|\\braia\\b|pague menos|\\buber\\b(?! ?eats)|^99\\b|\\b99 ?(app|pop|tecnologia)\\b|cabify|\\bmetro\\b|onibus|bilhete unico|estacionamento|sem parar|veloe|conectcar");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000031"),
                column: "Pattern",
                value: "ifood|rappi|ze delivery|delivery|aiqfome|uber ?eats|restaurante|lanchonete|\\bbar\\b|choperia|pizza|burger|mcdonald|\\bbk\\b|subway|starbucks|cafeteria|doceria|sorveteria|outback|habib|coco bambu|madero|giraffas|\\bkfc\\b|\\bbobs\\b|spoleto|cinema|ingresso|\\bshow\\b|teatro|steam|shein|shopee|aliexpress|mercado ?livre|magalu|magazine luiza|casas bahia|kabum|amazon|renner|riachuelo|\\bzara\\b|centauro|netshoes|boticario|sephora|perfumaria|\\bbet\\b|\\w+bet\\b|\\bbet ?\\d+|betano|betnacional|esportes da sorte|\\bkto\\b|blaze|aposta");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000032"),
                column: "Pattern",
                value: "ifood|rappi|uber ?eats|ze delivery|aiqfome|restaurante|lanchonete|padaria|panificadora|supermercado|\\bmercad(inho|o\\b)(?! ?(pago|livre|bitcoin))|mercearia|\\bhiper|\\bextra\\b|^dia\\b|sams club|savegnago|zaffari|muffato|condor|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|\\bbk\\b|subway|starbucks|outback|habib|coco bambu|madero|giraffas|\\bkfc\\b|\\bbobs\\b|\\bcafe\\b|confeitaria");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000033"),
                column: "Pattern",
                value: "\\buber\\b|^99\\b|\\b99 ?(app|pop|tecnologia)\\b|cabify|\\bposto\\b|combustive|gasolina|shell|ipiranga|petrobras|abastece|estacionamento|sem parar|veloe|conectcar|\\bmetro\\b|onibus|bilhete unico");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000034"),
                column: "Pattern",
                value: "aluguel|condominio|(?<!vibra )energia|\\benel\\b|\\blight\\b|cemig|copel|sabesp|cedae|copasa|embasa|sanepar|cpfl|energisa|equatorial|neoenergia|\\bagua\\b(?! (mineral|de coco))|comgas|(?<!na )internet|fibra|\\bsky\\b|\\boi\\b|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000035"),
                column: "Pattern",
                value: "farmacia|\\bfarma|droga|panvel|pacheco|\\braia\\b|pague menos|hospital|clinica|laboratorio|unimed|\\bamil\\b|hapvida|odonto|academia|smart ?fit|gympass|wellhub|totalpass");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000036"),
                column: "Pattern",
                value: "escola|colegio|faculdade|universidade|curso|udemy|alura|coursera|duolingo|livraria|material escolar");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000037"),
                column: "Pattern",
                value: "netflix|spotify|disney|hbo|max com|^max$|prime video|amazon ?prime|youtube|globoplay|paramount|deezer|crunchyroll|telecine|\\bmubi\\b|cinema|ingresso|steam|playstation|xbox|nintendo|\\bshow\\b|teatro|\\bbet\\b|\\w+bet\\b|\\bbet ?\\d+|betano|esportes da sorte|blaze|aposta");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000039"),
                column: "Pattern",
                value: "rendimento|\\bcdb\\b|tesouro|dividendo|juros sobre capital|\\bjcp\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000043"),
                column: "Pattern",
                value: "netflix|disney|hbo|\\bmax com\\b|^max$|prime video|amazon ?prime|globoplay|paramount|crunchyroll|apple tv|youtube ?premium|star ?plus|telecine|\\bmubi\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000051"),
                column: "Pattern",
                value: "energia eletrica|captacao tratamento e distribuicao de agua|telecomunicacoes|telefonia|comunicacao multimidia|televisao por assinatura|condominios|aluguel de imoveis|gas canalizado|gas liquefeito");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000052"),
                column: "Pattern",
                value: "farmaceuticos|medic|odontolog|hospital|laboratorios clinicos|planos de saude|atividades de atencao a saude|condicionamento fisico");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000055"),
                column: "Pattern",
                value: "energia eletrica|telecomunicacoes|telefonia|comunicacao multimidia|televisao por assinatura|condominios|planos de saude|seguros|administracao publica|\\bensino\\b(?! de (idiomas|esportes|arte))");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000058"),
                column: "Pattern",
                value: "\\btarifa|\\btar\\b|pacote de servicos|cesta de servicos|manutencao de conta|taxa de saque|tarifa de saque");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000061"),
                column: "Pattern",
                value: "\\bjuros|\\bencargos?\\b|rotativo|\\bmora\\b|financiamento de fatura|parcelamento de fatura");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000068"),
                column: "Pattern",
                value: "\\bmedic(?!amento)(?!.*veterinari)|odontolog|dentista|hospital(?! veterinario)|clinica(?! (veterinaria|de estetica|estetica))|laborator|psicolog|fisioterap|fonoaudiolog|terapia ocupacional|plano de saude|unimed|\\bamil\\b|bradesco saude|sulamerica saude|hapvida");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000069"),
                column: "Pattern",
                value: "\\bensino\\b(?! de (idiomas|esportes|arte))|educacao (infantil|superior|basica|profissional)|\\bescola\\b|colegio|faculdade|universidade|pos graduacao|creche");

            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT "Id", FIRST_VALUE("Id") OVER (PARTITION BY "UserId" ORDER BY "CreatedAt", "Id") AS "KeepId"
                    FROM "Folders" WHERE "IsSystem")
                UPDATE "Files" SET "FolderId" = ranked."KeepId"
                FROM ranked WHERE "Files"."FolderId" = ranked."Id" AND ranked."Id" <> ranked."KeepId";
                """);
            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT "Id", FIRST_VALUE("Id") OVER (PARTITION BY "UserId" ORDER BY "CreatedAt", "Id") AS "KeepId"
                    FROM "Folders" WHERE "IsSystem")
                DELETE FROM "Folders" USING ranked WHERE "Folders"."Id" = ranked."Id" AND ranked."Id" <> ranked."KeepId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Folders_UserId_System",
                table: "Folders",
                column: "UserId",
                unique: true,
                filter: "\"IsSystem\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Folders_UserId_System",
                table: "Folders");

            migrationBuilder.DropColumn(
                name: "CatalogAttemptedAt",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "EnrichmentAttempts",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Accounts");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Goals",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "Categories",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(7)",
                oldMaxLength: 7);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Accounts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000002"),
                column: "Pattern",
                value: "pagamento de fatura|pagamento recebido");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000003"),
                column: "Pattern",
                value: "aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|resgate cdb|tesouro direto");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000011"),
                column: "Pattern",
                value: "mercado ?pago|^pix marketplace$|^mp\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000012"),
                column: "Pattern",
                value: "\\bamazon\\b|\\bamzn\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000015"),
                column: "Pattern",
                value: "\\bdisney\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000019"),
                column: "Pattern",
                value: "\\bpagseguro\\b|\\bpagbank\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000020"),
                column: "Pattern",
                value: "\\bpicpay\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000025"),
                column: "Pattern",
                value: "ifd|mp|pg|pag|ec|pp|ppro|dl|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000026"),
                column: "Pattern",
                value: "\\b(ltda|sa|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|ai|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao)\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000027"),
                column: "Pattern",
                value: "netflix|spotify|disney|hbo|\\bmax\\b|prime video|amazon prime|youtube|deezer|globoplay|paramount|crunchyroll|apple com|icloud|google one|microsoft|xbox|playstation|nintendo|adobe|canva|chatgpt|openai|gympass|wellhub|smart ?fit|totalpass|dropbox|notion|github");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000029"),
                column: "Pattern",
                value: "aluguel|condominio|imobiliaria|energia|enel|\\blight\\b|cemig|copel|celesc|sabesp|\\bagua\\b|comgas|internet|fibra|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu|ipva|seguro|plano de saude|unimed|amil|sulamerica|escola|colegio|faculdade|mensalidade|financiamento|consorcio|emprestimo");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000030"),
                column: "Pattern",
                value: "supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|acougue|padaria|feira|posto|combustivel|gasolina|shell|ipiranga|petrobras|farmacia|drogaria|drogasil|\\braia\\b|pague menos|uber|\\b99\\b|cabify|metro|onibus|bilhete unico|estacionamento");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000031"),
                column: "Pattern",
                value: "ifood|rappi|ze delivery|delivery|aiqfome|uber eats|restaurante|lanchonete|\\bbar\\b|choperia|pizza|burger|mcdonald|\\bbk\\b|subway|starbucks|cafeteria|doceria|sorveteria|cinema|ingresso|\\bshow\\b|teatro|steam|shein|shopee|aliexpress|mercado livre|magalu|amazon|renner|riachuelo|\\bzara\\b|centauro|netshoes|boticario|sephora|perfumaria|\\bbet\\b|blaze|aposta");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000032"),
                column: "Pattern",
                value: "ifood|rappi|restaurante|lanchonete|padaria|panificadora|supermercado|mercado(?! (pago|livre))|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|\\bbk\\b|subway|\\bcafe\\b|confeitaria");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000033"),
                column: "Pattern",
                value: "uber|\\b99\\b|99app|cabify|posto|combustivel|gasolina|shell|ipiranga|petrobras|estacionamento|sem parar|veloe|conectcar|metro|onibus|bilhete unico");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000034"),
                column: "Pattern",
                value: "aluguel|condominio|energia|enel|\\blight\\b|cemig|copel|sabesp|\\bagua\\b|comgas|internet|\\bvivo\\b|\\bclaro\\b|\\btim\\b|\\bnet\\b|iptu");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000035"),
                column: "Pattern",
                value: "farmacia|drogaria|drogasil|\\braia\\b|pague menos|hospital|clinica|laboratorio|unimed|amil|odonto|academia|smart ?fit");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000036"),
                column: "Pattern",
                value: "escola|faculdade|universidade|curso|udemy|alura|coursera|livraria|material escolar");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000037"),
                column: "Pattern",
                value: "netflix|spotify|disney|hbo|max com|prime video|youtube|cinema|ingresso|steam|playstation|xbox|nintendo|\\bshow\\b|teatro");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000039"),
                column: "Pattern",
                value: "rendimento|resgate|cdb|tesouro|dividendo|juros");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000043"),
                column: "Pattern",
                value: "netflix|disney|hbo|\\bmax\\b|prime video|amazon prime|globoplay|paramount|crunchyroll|apple tv|youtube premium|star plus|telecine");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000051"),
                column: "Pattern",
                value: "energia eletrica|captacao tratamento e distribuicao de agua|telecomunicacoes|condominios|aluguel de imoveis|gas canalizado");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000052"),
                column: "Pattern",
                value: "farmaceuticos|medic|odontolog|hospital|laboratorios clinicos|planos de saude|atividades de atencao a saude");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000055"),
                column: "Pattern",
                value: "energia eletrica|telecomunicacoes|condominios|planos de saude|seguros|administracao publica|\\bensino\\b");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000058"),
                column: "Pattern",
                value: "\\btarifa|pacote de servicos|cesta de servicos|manutencao de conta|taxa de saque|tarifa de saque");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000061"),
                column: "Pattern",
                value: "\\bjuros|encargos|rotativo|\\bmora\\b|financiamento de fatura|parcelamento de fatura");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000068"),
                column: "Pattern",
                value: "\\bsaude\\b|medic|odontolog|dentista|hospital|clinica|laborator|psicolog|fisioterap|fonoaudiolog|terapia ocupacional|plano de saude|unimed|amil|bradesco saude|sulamerica saude|hapvida");

            migrationBuilder.UpdateData(
                table: "ClassificationRules",
                keyColumn: "Id",
                keyValue: new Guid("c1a55100-0000-0000-0000-000000000069"),
                column: "Pattern",
                value: "\\bensino\\b|educacao|escola|colegio|faculdade|universidade|pos graduacao|creche");
        }
    }
}
