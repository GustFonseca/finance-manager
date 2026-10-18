import type { IconName } from './TitleBar';

export type Program = {
  route: string;
  title: string;
  icon: IconName;
  color: string;
  description: string;
};

export const PROGRAMS: Program[] = [
  {
    route: '/',
    title: 'Painel',
    icon: 'line-chart',
    color: '#2E7D32',
    description: 'Resumo do mês',
  },
  {
    route: '/transactions',
    title: 'Transações',
    icon: 'exchange',
    color: '#1565C0',
    description: 'Receitas e despesas',
  },
  {
    route: '/accounts',
    title: 'Contas',
    icon: 'bank',
    color: '#6D4C41',
    description: 'Contas e saldos',
  },
  {
    route: '/goals',
    title: 'Metas',
    icon: 'bullseye',
    color: '#C62828',
    description: 'Objetivos de economia',
  },
  {
    route: '/categories',
    title: 'Categorias',
    icon: 'tags',
    color: '#EF6C00',
    description: 'Organize receitas e despesas',
  },
  {
    route: '/spending',
    title: 'Análise de gastos',
    icon: 'pie-chart',
    color: '#6A1B9A',
    description: 'Onde você mais gasta e o que reduzir',
  },
  {
    route: '/merchants',
    title: 'Estabelecimentos',
    icon: 'shopping-cart',
    color: '#00838F',
    description: 'Quanto você gasta em cada lugar',
  },
  {
    route: '/avoidable',
    title: 'Gastos evitáveis',
    icon: 'scissors',
    color: '#C62828',
    description: 'Onde dá para cortar sem sofrer',
  },
  {
    route: '/savings',
    title: 'Plano de economia',
    icon: 'money',
    color: '#2E7D32',
    description: 'Meta, orçamento e onde cortar',
  },
  {
    route: '/challenges',
    title: 'Desafios',
    icon: 'trophy',
    color: '#F9A825',
    description: 'Desafios para gastar menos',
  },
  {
    route: '/events',
    title: 'Visualizar eventos',
    icon: 'list-alt',
    color: '#455A64',
    description: 'Histórico das suas ações',
  },
];

export function findProgram(route: string): Program | undefined {
  return PROGRAMS.find((program) => program.route === route);
}
