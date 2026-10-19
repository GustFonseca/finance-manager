import { ProfileDto, UpdateProfileRequest } from '../types';

export function profile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    email: 'g@x.com',
    name: 'Gustavo',
    isAdmin: false,
    avatarIcon: null,
    avatarColor: null,
    birthDate: null,
    phone: null,
    city: null,
    state: null,
    occupation: null,
    monthlyIncomeCents: null,
    payday: null,
    dependents: null,
    digestByEmail: false,
    memberSince: '2026-03-15T12:00:00Z',
    ...overrides,
  };
}

export function profileUpdate(overrides: Partial<UpdateProfileRequest> = {}): UpdateProfileRequest {
  const { email, isAdmin, memberSince, ...rest } = profile();
  return { ...rest, ...overrides };
}
