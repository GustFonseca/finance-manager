import type { HelpRegistry } from '@/components/xp';

export const HELP: HelpRegistry = {
  '/': {
    title: 'Painel',
    icon: 'line-chart',
    summary:
      'O Painel é o resumo do mês escolhido: quanto entrou, quanto saiu, quanto você ainda pode gastar hoje, como o mês deve terminar e onde estão os gastos que dá para cortar.',
    howItWorks: [
      'Os números vêm das suas transações. Transferências entre suas contas, pagamento de fatura e aplicações não contam como gasto nem como renda.',
      '"Resumo" compara a semana (últimos 7 dias) e o mês até hoje com o mesmo período anterior e mostra o maior gasto e o maior aumento.',
      '"Quanto posso gastar hoje" pega o que deve entrar no mês, tira o que já saiu, as contas fixas que ainda vão vencer e a sua meta de economia, e divide pelos dias que faltam (contando hoje).',
      '"Alertas de orçamento" avisa quando uma categoria passa de 80% do limite que você definiu no Plano de economia.',
      '"Previsão do mês" soma o salário esperado (o que se repetiu em pelo menos 2 dos últimos 3 meses), as contas fixas e parcelas que faltam e uma estimativa dos gastos do dia a dia pelo seu ritmo por dia da semana nos últimos 3 meses.',
    ],
    steps: [
      { title: 'Escolha o mês e a conta', text: 'No topo, escolha o mês e, se quiser, uma conta. Todos os cartões do Painel passam a mostrar só esse período e essa conta.' },
      { title: 'Veja quanto pode gastar hoje', text: 'O cartão "Quanto posso gastar hoje" mostra quanto ainda cabe no dia sem comprometer as contas e a meta. Se passar, o limite dos próximos dias diminui.' },
      { title: 'Confira a previsão', text: 'A "Previsão do mês" mostra a sobra esperada e os próximos lançamentos. Se aparecer o aviso vermelho, o mês tende a fechar no negativo.' },
      { title: 'Abra os detalhes', text: 'Use "Ver gastos evitáveis" para ver onde cortar, e as listas de custos fixos e parcelamentos para saber o que já está comprometido.' },
    ],
    tips: [
      'Importe o extrato com frequência: quanto mais histórico, mais precisas ficam a previsão e o limite do dia.',
      'Defina a meta de economia no Plano de economia para o limite do dia já reservar esse dinheiro.',
    ],
  },
  '/transactions': {
    title: 'Transações',
    icon: 'exchange',
    summary: 'Aqui ficam todas as suas receitas e despesas. Você pode lançar à mão, importar o extrato do banco, editar, filtrar e anexar comprovantes.',
    howItWorks: [
      'Cada transação pertence a uma conta e a uma categoria e atualiza o saldo da conta.',
      'Ao importar, o sistema lê arquivos CSV do Nubank (conta e cartão), OFX e CSV de outros bancos, aponta o que parece duplicado e sugere a categoria pelo estabelecimento.',
      'O estabelecimento é reconhecido pela descrição e guardado no catálogo de Estabelecimentos, que aprende a categoria que você usa.',
      'Comprovantes anexados ficam guardados na pasta "Comprovantes" dos seus arquivos.',
      '"Ler nota" procura o QR Code da NFC-e para achar a empresa pelo CNPJ e lê o texto da nota no próprio aparelho para preencher o valor, a data e a loja. A foto fica anexada como comprovante.',
    ],
    steps: [
      { title: 'Lance ou importe', text: 'Use "Nova transação" para lançar à mão ou "Importar extrato" para trazer o arquivo do banco. No assistente, escolha o arquivo e a conta, revise a lista e clique em Importar.' },
      { title: 'Filtre', text: 'Use os filtros de mês, conta, categoria, tipo e a busca para achar o que precisa. A busca ignora acentos no nome do estabelecimento.' },
      { title: 'Ler nota', text: 'Use "Ler nota" (também no Painel) e tire uma foto da nota fiscal ou do cupom. No celular abre a câmera; no computador, escolha a imagem. O app lê o QR Code da NFC-e e o texto da nota no próprio aparelho, sem enviar a imagem para leitura.' },
      { title: 'Confira e lance', text: 'Os campos que não deram para ler ficam marcados para você preencher. Sempre confira o valor, a data e a categoria antes de clicar em Lançar: a transação é criada e a foto fica anexada como comprovante na pasta "Comprovantes".' },
      { title: 'Edite ou anexe', text: 'Clique numa transação para editar, remover, anexar um comprovante (foto ou PDF) ou abrir o comprovante já anexado.' },
    ],
    tips: ['Revise a categoria na importação: o sistema aprende com a sua escolha e acerta mais nas próximas.'],
  },
  '/accounts': {
    title: 'Contas',
    icon: 'bank',
    summary: 'Lista as suas contas (bancos, carteira, poupança) e o saldo de cada uma.',
    howItWorks: [
      'O saldo de cada conta sobe com as receitas e desce com as despesas lançadas ou importadas nela.',
      'O Patrimônio líquido, no Planejamento, soma o saldo de todas as contas e desconta as dívidas.',
    ],
    steps: [
      { title: 'Crie suas contas', text: 'Use "Nova conta" e cadastre uma conta para cada banco ou lugar onde guarda dinheiro. Ao importar um extrato, escolha a conta certa.' },
      { title: 'Acompanhe os saldos', text: 'Se um saldo não bater com o banco, confira se todas as transações daquele período foram importadas.' },
    ],
  },
  '/goals': {
    title: 'Metas',
    icon: 'bullseye',
    summary: 'Metas são objetivos com valor e prazo, como uma viagem ou a reserva de emergência.',
    howItWorks: [
      'Você define o valor alvo e, se quiser, um prazo.',
      'Cada vez que guardar dinheiro para a meta, adicione o valor; a barra mostra o progresso.',
      'Uma meta pode ser usada como a sua reserva de emergência, no Planejamento.',
    ],
    steps: [
      { title: 'Crie uma meta', text: 'Clique em "Nova meta", dê um nome, o valor alvo e o prazo (opcional).' },
      { title: 'Registre o que guardou', text: 'Use "Adicionar..." sempre que separar dinheiro para ela.' },
      { title: 'Conclua', text: 'Quando chegar lá, clique em "Concluir". O Resumo do Painel mostra as metas ativas e quanto falta.' },
    ],
  },
  '/categories': {
    title: 'Categorias',
    icon: 'tags',
    summary: 'Categorias organizam receitas e despesas (Moradia, Alimentação, Lazer...).',
    howItWorks: [
      'Cada transação tem uma categoria. Ela é usada nos gráficos, no orçamento e na classificação de essencial ou supérfluo.',
      'A categoria "Outros" é a de captura: o que cai nela ainda precisa ser organizado.',
      'Categorias com transações não podem ser apagadas; mude as transações de categoria antes.',
    ],
    steps: [
      { title: 'Crie ou ajuste', text: 'Use "Nova categoria" para criar categorias de receita ou despesa e escolha uma cor para identificar nos gráficos.' },
      { title: 'Use no orçamento', text: 'Defina limites por categoria no Plano de economia para receber alertas no Painel.' },
    ],
  },
  '/spending': {
    title: 'Análise de gastos',
    icon: 'pie-chart',
    summary: 'Mostra onde o seu dinheiro vai: por categoria, por estabelecimento e por tipo de gasto (essencial, variável ou supérfluo).',
    howItWorks: [
      'Cada gasto é classificado pelas regras do sistema: contas e impostos são essenciais; delivery, bares, apostas e assinaturas são supérfluos; mercado e combustível são variáveis.',
      'Você pode mudar a classe de um estabelecimento em Estabelecimentos ou em Gastos evitáveis, e a sua escolha vale a partir daí.',
      'Os gráficos comparam o mês escolhido com os anteriores para mostrar o que subiu.',
    ],
    steps: [
      { title: 'Escolha o período', text: 'Selecione o mês para ver a divisão dos gastos.' },
      { title: 'Ache os maiores', text: 'Veja as categorias e lugares que mais pesam e clique para ver os detalhes.' },
    ],
  },
  '/merchants': {
    title: 'Estabelecimentos',
    icon: 'shopping-cart',
    summary: 'Catálogo dos lugares onde você gasta, com quanto gastou em cada um no mês ou no ano.',
    howItWorks: [
      'O estabelecimento é reconhecido pela descrição da transação (iFood, Uber, mercado do bairro...).',
      'Quando o extrato traz o CNPJ, o sistema consulta a atividade da empresa na Receita (via BrasilAPI) e usa isso para sugerir a categoria e a classe do gasto.',
      'A categoria que você escolhe para um estabelecimento é aprendida e aplicada às próximas transações dele.',
    ],
    steps: [
      { title: 'Organize', text: 'Use "Organizar gastos" para dar categoria aos estabelecimentos que ainda estão em "Outros".' },
      { title: 'Veja o histórico', text: 'Clique num estabelecimento para ver a atividade, o total gasto e o histórico mês a mês.' },
      { title: 'Ajuste a classe', text: 'Marque um lugar como essencial ou supérfluo se o sistema tiver errado.' },
    ],
  },
  '/avoidable': {
    title: 'Gastos evitáveis',
    icon: 'scissors',
    summary: 'Reúne tudo o que dá para cortar ou conferir: supérfluos, assinaturas, pequenos gastos repetidos, picos, compras grandes, tarifas, cobranças duplicadas e contas que subiram.',
    howItWorks: [
      'Supérfluos: gastos classificados como supérfluos no mês, com quanto daria investindo a metade a 100% do CDI por 12 meses.',
      'Assinaturas: cobranças recorrentes de serviços. Mostra preço que subiu, serviço que voltou a cobrar e serviços parecidos ao mesmo tempo. Marque "Mantenho" ou "Cancelei"; se cobrar depois de cancelada, você é avisado.',
      'Pequenos gastos: compras abaixo de R$ 30 que se repetem pelo menos 4 vezes por mês no mesmo lugar.',
      'Picos: lugares ou categorias muito acima do normal deles, calculado pela mediana dos últimos 12 meses e pela variação típica de cada um.',
      'Cobranças para conferir: o mesmo valor (a partir de R$ 30) no mesmo lugar em até 3 dias, sem estorno depois.',
      'Contas que subiram: conta fixa que subiu 10% ou mais e acima da inflação (IPCA de 12 meses do Banco Central).',
      'Tarifas e juros: tarifas bancárias, anuidade, IOF, juros e multas do mês e dos últimos 12 meses.',
    ],
    steps: [
      { title: 'Escolha o mês', text: 'Selecione o mês e, se quiser, a conta.' },
      { title: 'Comece pelo dinheiro perdido', text: 'Confira "Cobranças para conferir" e "Tarifas e juros": é dinheiro que pode voltar ou deixar de sair. Use "Está certo" ou "Ciente" para tirar um alerta da lista.' },
      { title: 'Decida as assinaturas', text: 'Para cada assinatura, marque "Mantenho" ou "Cancelei". O sistema passa a vigiar se a cancelada continua cobrando.' },
      { title: 'Ajuste o que estiver errado', text: 'Se algo não for desnecessário, use "Não é desnecessário"; se for, "Marcar como supérfluo". A classificação passa a valer para esse estabelecimento.' },
    ],
    tips: ['O valor em horas de trabalho usa a sua renda média e as horas que você informou no Plano de economia.'],
  },
  '/savings': {
    title: 'Plano de economia',
    icon: 'money',
    summary: 'Defina quanto quer economizar por mês e limites por categoria; o sistema sugere onde cortar.',
    howItWorks: [
      'A meta do mês compara receitas menos despesas com o valor que você quer guardar.',
      'Os limites sugeridos partem da sua média dos últimos 3 meses e cortam mais nas categorias supérfluas para fechar a meta.',
      'Os limites definidos aqui geram os alertas de orçamento do Painel.',
      'As horas de trabalho por mês servem para mostrar quanto tempo de trabalho cada gasto custa.',
    ],
    steps: [
      { title: 'Defina a meta', text: 'Clique em "Definir meta" e informe quanto quer guardar por mês.' },
      { title: 'Aplique ou ajuste limites', text: 'Use "Aplicar limites sugeridos" ou clique numa categoria para definir o limite dela.' },
      { title: 'Informe suas horas', text: 'Em "Horas de trabalho", informe quantas horas trabalha por mês (8h × 22 dias = 176h).' },
    ],
  },
  '/challenges': {
    title: 'Desafios',
    icon: 'trophy',
    summary: 'Desafios como "30 dias sem delivery" ou "uma semana sem supérfluos", com quanto você economizou.',
    howItWorks: [
      'Você escolhe onde o desafio vale (gastos supérfluos, uma categoria ou um estabelecimento), quanto pode gastar (vazio = nada) e a duração (até 90 dias).',
      'Se o gasto passar do limite, o desafio é perdido; se chegar ao fim dentro do limite, é concluído.',
      'A economia estimada compara o que você gastou com o seu ritmo nos 90 dias anteriores ao desafio.',
    ],
    steps: [
      { title: 'Crie um desafio', text: 'Clique em "Novo desafio", dê um nome, escolha onde vale, o limite e os dias. Ele começa hoje.' },
      { title: 'Acompanhe', text: 'Cada desafio mostra os dias passados, o gasto e a economia estimada. Os números se atualizam com as transações que você lança ou importa.' },
    ],
  },
  '/events': {
    title: 'Visualizar eventos',
    icon: 'list-alt',
    summary: 'Histórico das suas ações no sistema: transações criadas e alteradas, importações, metas, regras, decisões e mais.',
    howItWorks: ['Cada alteração importante gera um evento com data e descrição. Importações e exclusões em massa aparecem como um único evento.'],
    steps: [{ title: 'Consulte', text: 'Use a lista para saber o que mudou e quando, por exemplo, para conferir uma importação.' }],
  },
  '/wishlist': {
    title: 'Lista de espera',
    icon: 'hourglass-half',
    summary: 'Antes de comprar por impulso, anote o desejo e espere 48 horas. Se desistir, o valor conta como economia.',
    howItWorks: [
      'Cada desejo fica em espera por 48 horas a partir de quando você anota.',
      'Depois desse prazo, você decide: "Comprei" ou "Desisti". O botão "Comprei" só aparece quando a espera acaba.',
      'O total de "Desisti" vira o valor economizado no topo da janela.',
      'Cada item mostra quantas horas de trabalho ele custa.',
    ],
    steps: [
      { title: 'Anote o desejo', text: 'Clique em "Novo desejo" e informe o que é, o preço e, se quiser, o link.' },
      { title: 'Espere', text: 'O item mostra a partir de quando você pode decidir. Se a vontade passar antes, já pode clicar em "Desisti".' },
      { title: 'Decida', text: 'Passadas as 48 horas, escolha "Comprei" ou "Desisti". Mudou de ideia? Use "Voltar para a espera".' },
    ],
  },
  '/debts': {
    title: 'Dívidas',
    icon: 'credit-card',
    summary: 'Cadastre suas dívidas e simule a forma mais barata de quitá-las.',
    howItWorks: [
      'Para cada dívida, informe o saldo devedor, os juros ao mês e a parcela mínima.',
      'O simulador paga todas as mínimas e usa o dinheiro extra (e as parcelas que vão sobrando) para quitar uma dívida por vez.',
      'Avalanche começa pela dívida com os maiores juros (paga menos juros no total). Bola de neve começa pela de menor saldo (quita a primeira mais rápido).',
      'Se as parcelas não cobrem os juros, o simulador avisa que a dívida não acaba.',
    ],
    steps: [
      { title: 'Cadastre', text: 'Clique em "Nova dívida" e informe o saldo devedor, os juros ao mês (ex.: 12,5) e a parcela mínima.' },
      { title: 'Simule', text: 'Informe quanto pode pagar a mais por mês e clique em "Simular" para comparar as duas estratégias.' },
      { title: 'Mantenha atualizado', text: 'Atualize o saldo de vez em quando: ele também entra no Patrimônio líquido.' },
    ],
  },
  '/planning': {
    title: 'Planejamento',
    icon: 'compass',
    summary: 'Reserva de emergência, contas sazonais (IPVA, IPTU...) e patrimônio líquido em um só lugar.',
    howItWorks: [
      'Reserva de emergência: alvo = seus gastos não supérfluos médios dos últimos 3 meses × a quantidade de meses que você escolher (padrão 6). O valor guardado vem da meta que você ligar a ela.',
      'A previsão de quando chega lá usa quanto você economizou em média por mês.',
      'Contas sazonais: IPVA, IPTU, matrícula, seguros anuais e anuidades encontrados no último ano, ou despesas marcadas como anuais. A próxima é esperada um ano depois, e o sistema mostra quanto separar por mês até ela.',
      'Patrimônio líquido: saldo de todas as contas menos as dívidas cadastradas, com o histórico dos últimos 12 meses.',
    ],
    steps: [
      { title: 'Configure a reserva', text: 'Escolha quantos meses quer cobrir e qual meta guarda esse dinheiro. As mudanças são salvas na hora.' },
      { title: 'Prepare as sazonais', text: 'Veja o total por mês das contas sazonais e separe esse valor para não ser pego de surpresa.' },
      { title: 'Acompanhe o patrimônio', text: 'Confira se o patrimônio líquido cresce mês a mês.' },
    ],
  },
  '/tax': {
    title: 'Imposto de Renda',
    icon: 'file-text-o',
    summary: 'Junta, para o ano escolhido, o que você recebeu de cada fonte e as despesas que podem ser dedutíveis, com o CNPJ/CPF de quem recebeu.',
    howItWorks: [
      'Rendimentos: as entradas do ano agrupadas por quem pagou (sem contar transferências entre suas contas).',
      'Deduções possíveis: despesas reconhecidas como saúde, educação, previdência privada (PGBL) e pensão alimentícia, agrupadas por prestador.',
      'O CNPJ ou CPF aparece quando o extrato traz o documento.',
      'É um apoio para a declaração: confira sempre com os comprovantes e com os limites oficiais da Receita Federal.',
    ],
    steps: [
      { title: 'Escolha o ano', text: 'O ano anterior já vem selecionado, que é o da declaração.' },
      { title: 'Confira os valores', text: 'Revise as fontes de renda e os prestadores de cada dedução.' },
      { title: 'Copie o resumo', text: 'Use "Copiar resumo" para levar os valores para onde estiver preenchendo a declaração.' },
    ],
  },
  '/calendar': {
    title: 'Calendário',
    icon: 'calendar',
    summary: 'O mês dia a dia: o que já entrou e saiu e o que está previsto (salário, contas fixas, parcelas e contas sazonais).',
    howItWorks: [
      'Os valores realizados vêm das suas transações de cada dia.',
      'Os previstos vêm da Previsão do mês (salário, contas fixas e parcelas que ainda não vieram) e das contas sazonais esperadas para o mês.',
      'Os pontos coloridos indicam o tipo de cada lançamento; a legenda explica as cores.',
    ],
    steps: [
      { title: 'Escolha o mês', text: 'Use o seletor para navegar entre os meses.' },
      { title: 'Abra um dia', text: 'Clique num dia para ver a lista do que aconteceu ou está previsto nele.' },
    ],
  },
  '/rules': {
    title: 'Regras de classificação',
    icon: 'sliders',
    summary: 'As regras que o sistema usa para reconhecer estabelecimentos, separar dinheiro próprio, sugerir categorias e classificar gastos. Só administradores veem esta janela.',
    howItWorks: [
      'Cada regra tem um tipo (por exemplo: Supérfluo, Conta fixa, Marca, Tarifa), um padrão e, em alguns tipos, um valor.',
      'O padrão é uma expressão regular aplicada ao texto em minúsculas e sem acentos (nome do estabelecimento, atividade e descrição).',
      'Regras com prioridade menor são testadas primeiro. Regras desativadas deixam de valer sem serem apagadas.',
      'As mudanças valem para todos os usuários logo após salvar.',
    ],
    steps: [
      { title: 'Encontre a regra', text: 'Filtre por tipo ou busque pelo padrão, valor ou observação.' },
      { title: 'Crie ou edite', text: 'Use "Nova regra" ou clique numa regra. Escolha o tipo, escreva o padrão (ex.: \\bbar\\b|boteco) e, se o tipo pedir, o valor.' },
      { title: 'Teste antes de salvar', text: 'Clique em "Testar" para ver quantas das suas descrições dos últimos 12 meses o padrão pegaria e alguns exemplos.' },
      { title: 'Ative ou desative', text: 'Use a caixa "Ativa" para ligar ou desligar uma regra sem perdê-la.' },
    ],
    tips: ['Use \\b para casar palavras inteiras e | para alternativas. Padrões muito genéricos podem classificar errado muitas transações.'],
  },
  '/account': {
    title: 'Minha conta',
    icon: 'user-circle',
    summary: 'Seus dados pessoais, o ícone que representa você no sistema e as suas preferências.',
    howItWorks: [
      'O ícone e a cor escolhidos aparecem no topo do menu Iniciar, ao lado do seu nome. Sem ícone, aparece a primeira letra do nome.',
      'O e-mail vem da sua conta Google e não pode ser mudado aqui.',
      'Os dados ficam guardados só na sua conta e não são mostrados a outras pessoas. Todos os campos, menos o nome, são opcionais.',
      'Renda mensal, dia do pagamento e dependentes serão usados em recursos futuros, como previsões e o Imposto de Renda.',
    ],
    steps: [
      { title: 'Escolha o ícone e a cor', text: 'No cartão "Ícone", clique num desenho e numa cor de fundo. Use "Usar a letra" para voltar à inicial do nome.' },
      { title: 'Preencha os dados', text: 'Complete os dados pessoais e financeiros que quiser. O telefone é formatado enquanto você digita.' },
      { title: 'Salve', text: 'Clique em "Salvar" na barra de ferramentas. Se algum campo estiver errado, a janela mostra o que corrigir.' },
    ],
    tips: ['Também dá para abrir esta janela clicando no seu nome no topo do menu Iniciar.'],
  },
};
