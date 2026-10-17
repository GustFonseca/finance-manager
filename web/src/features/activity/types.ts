export type ActivityType = 'INFO' | 'WARNING';

export type ActivityLogDto = {
  id: string;
  type: ActivityType;
  /** Area of the app: "Transações", "Arquivos", "Sessão"… */
  source: string;
  description: string;
  createdAt: string;
};
