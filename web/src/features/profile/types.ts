export type ProfileDto = {
  email: string;
  name: string;
  isAdmin: boolean;
  avatarIcon: string | null;
  avatarColor: string | null;
  birthDate: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  monthlyIncomeCents: number | null;
  payday: number | null;
  dependents: number | null;
  digestByEmail: boolean;
  memberSince: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
};

export type UpdateProfileRequest = Omit<
  ProfileDto,
  'email' | 'isAdmin' | 'memberSince' | 'lastLoginAt' | 'lastSeenAt' | 'loginCount'
>;
