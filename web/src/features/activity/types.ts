export type ActivityType = 'INFO' | 'WARNING';

export type ActivityLogDto = {
  id: string;
  type: ActivityType;
  source: string;
  description: string;
  createdAt: string;
};
