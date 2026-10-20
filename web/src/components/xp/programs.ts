import { palette } from '@/theme';
import type { IconName } from './TitleBar';

export type Program = {
  route: string;
  title: string;
  icon: IconName;
  color: string;
  description: string;
  adminOnly?: boolean;
  startMenuOnly?: boolean;
};

export const PROGRAMS: Program[] = [
  {
    route: '/',
    title: 'Painel',
    icon: 'line-chart',
    color: palette.green,
    description: 'Resumo do mês',
  },
  {
    route: '/transactions',
    title: 'Transações',
    icon: 'exchange',
    color: palette.navy,
    description: 'Receitas e despesas',
  },
  {
    route: '/accounts',
    title: 'Contas',
    icon: 'bank',
    color: palette.teal,
    description: 'Contas e saldos',
  },
  {
    route: '/goals',
    title: 'Metas',
    icon: 'bullseye',
    color: palette.coral,
    description: 'Objetivos de economia',
  },
  {
    route: '/categories',
    title: 'Categorias',
    icon: 'tags',
    color: palette.amber,
    description: 'Organize receitas e despesas',
  },
  {
    route: '/spending',
    title: 'Análise de gastos',
    icon: 'pie-chart',
    color: palette.plum,
    description: 'Onde você mais gasta e o que reduzir',
  },
  {
    route: '/merchants',
    title: 'Estabelecimentos',
    icon: 'shopping-cart',
    color: palette.sky,
    description: 'Quanto você gasta em cada lugar',
  },
  {
    route: '/avoidable',
    title: 'Gastos evitáveis',
    icon: 'scissors',
    color: palette.coral,
    description: 'Onde dá para cortar sem sofrer',
  },
  {
    route: '/savings',
    title: 'Plano de economia',
    icon: 'money',
    color: palette.green,
    description: 'Meta, orçamento e onde cortar',
  },
  {
    route: '/challenges',
    title: 'Desafios',
    icon: 'trophy',
    color: palette.amber,
    description: 'Desafios para gastar menos',
  },
  {
    route: '/events',
    title: 'Visualizar eventos',
    icon: 'list-alt',
    color: palette.tealDeep,
    description: 'Histórico das suas ações',
    startMenuOnly: true,
  },
  {
    route: '/wishlist',
    title: 'Lista de espera',
    icon: 'hourglass-half',
    color: palette.plum,
    description: 'Espere antes de comprar por impulso',
  },
  {
    route: '/debts',
    title: 'Dívidas',
    icon: 'credit-card',
    color: palette.coral,
    description: 'Planeje como quitar suas dívidas',
  },
  {
    route: '/planning',
    title: 'Planejamento',
    icon: 'compass',
    color: palette.greenLight,
    description: 'Reserva, contas sazonais e patrimônio',
  },
  {
    route: '/tax',
    title: 'Imposto de Renda',
    icon: 'file-text-o',
    color: palette.navy,
    description: 'Resumo do ano para a declaração',
  },
  {
    route: '/calendar',
    title: 'Calendário',
    icon: 'calendar',
    color: palette.amber,
    description: 'O que entra e sai em cada dia',
  },
  {
    route: '/rules',
    title: 'Regras de classificação',
    icon: 'sliders',
    color: palette.tealDark,
    description: 'Como o sistema classifica seus gastos',
    adminOnly: true,
  },
  {
    route: '/users',
    title: 'Usuários',
    icon: 'users',
    color: palette.tealDark,
    description: 'Quem usa o sistema e quando acessou',
    adminOnly: true,
    startMenuOnly: true,
  },
  {
    route: '/account',
    title: 'Minha conta',
    icon: 'user-circle',
    color: palette.sky,
    description: 'Seus dados, ícone e preferências',
    startMenuOnly: true,
  },
];

export function visiblePrograms(isAdmin: boolean): Program[] {
  return PROGRAMS.filter((program) => !program.adminOnly || isAdmin);
}

export function desktopPrograms(programs: Program[]): Program[] {
  return programs.filter((program) => !program.startMenuOnly);
}

export function findProgram(route: string): Program | undefined {
  return PROGRAMS.find((program) => program.route === route);
}
