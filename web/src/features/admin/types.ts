export type UserOverviewDto = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
  transactionCount: number;
  activeLast7Days: boolean;
};
