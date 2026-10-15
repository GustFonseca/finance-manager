import type { IconName } from './TitleBar';

export type Program = {
  /** Route path (without the GitHub Pages base URL); also the window id. */
  route: string;
  title: string;
  icon: IconName;
  /** Icon tint on the desktop and in the Start menu. */
  color: string;
  description: string;
};

/**
 * Every app screen, as an XP "program". The Start menu, the desktop icons and
 * the taskbar are all generated from this list.
 */
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
];

export function findProgram(route: string): Program | undefined {
  return PROGRAMS.find((program) => program.route === route);
}
