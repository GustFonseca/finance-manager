import type { IconName } from '@/components/xp';
import { formatCentsForInput, parseAmountToCents } from '@/lib/money';
import { palette } from '@/theme';
import { ProfileDto, UpdateProfileRequest } from './types';

export const MAX_NAME_LENGTH = 100;
export const MAX_TEXT_LENGTH = 100;
export const MAX_DEPENDENTS = 20;
export const MIN_BIRTH_DATE = '1900-01-01';

export const AVATAR_ICONS: IconName[] = [
  'user',
  'user-secret',
  'smile-o',
  'rocket',
  'star',
  'heart',
  'coffee',
  'gamepad',
  'music',
  'camera',
  'plane',
  'car',
  'bicycle',
  'paw',
  'leaf',
  'tree',
  'sun-o',
  'moon-o',
  'bolt',
  'diamond',
  'trophy',
  'briefcase',
  'graduation-cap',
  'flask',
  'code',
  'paint-brush',
  'book',
  'anchor',
  'futbol-o',
  'cutlery',
];

export const AVATAR_COLORS: string[] = [
  palette.teal,
  palette.green,
  palette.greenLight,
  palette.amber,
  palette.coral,
  palette.sky,
  palette.plum,
  palette.navy,
  palette.tealDeep,
  palette.stoneDark,
];

export const BRAZILIAN_STATES: { uf: string; name: string }[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export const MESSAGES = {
  name: 'Informe o seu nome.',
  nameLength: `O nome pode ter até ${MAX_NAME_LENGTH} caracteres.`,
  birthDate: 'Informe uma data de nascimento entre 01/01/1900 e hoje.',
  phone: 'Telefone inválido. Use DDD + número, por exemplo (11) 91234-5678.',
  city: `A cidade pode ter até ${MAX_TEXT_LENGTH} caracteres.`,
  occupation: `A profissão pode ter até ${MAX_TEXT_LENGTH} caracteres.`,
  income: 'Informe a renda como um valor válido, por exemplo 3.500,00.',
  payday: 'O dia do pagamento deve ficar entre 1 e 31.',
  dependents: `Os dependentes devem ficar entre 0 e ${MAX_DEPENDENTS}.`,
} as const;

export type ProfileForm = {
  name: string;
  avatarIcon: string | null;
  avatarColor: string | null;
  birthDate: string;
  phone: string;
  city: string;
  state: string;
  occupation: string;
  income: string;
  payday: string;
  dependents: string;
  digestByEmail: boolean;
};

export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 13);
  if (digits.length > 11) return `+${digits.slice(0, digits.length - 11)} ${formatPhone(digits.slice(-11))}`;
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${area}) ${number}`;
  const split = number.length === 9 ? 5 : 4;
  return `(${area}) ${number.slice(0, split)}-${number.slice(split)}`;
}

export function toForm(profile: ProfileDto): ProfileForm {
  return {
    name: profile.name,
    avatarIcon: profile.avatarIcon,
    avatarColor: profile.avatarColor,
    birthDate: profile.birthDate?.slice(0, 10) ?? '',
    phone: formatPhone(profile.phone ?? ''),
    city: profile.city ?? '',
    state: profile.state ?? '',
    occupation: profile.occupation ?? '',
    income: profile.monthlyIncomeCents === null ? '' : formatCentsForInput(profile.monthlyIncomeCents),
    payday: profile.payday === null ? '' : String(profile.payday),
    dependents: profile.dependents === null ? '' : String(profile.dependents),
    digestByEmail: profile.digestByEmail,
  };
}

function optional(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}

function wholeNumber(value: string, min: number, max: number): number | null | undefined {
  const text = value.trim();
  if (!text) return null;
  const number = Number(text);
  return /^\d+$/.test(text) && number >= min && number <= max ? number : undefined;
}

export type ValidationResult = { request: UpdateProfileRequest } | { error: string };

export function validateProfile(form: ProfileForm, today: string): ValidationResult {
  const name = form.name.trim();
  if (!name) return { error: MESSAGES.name };
  if (name.length > MAX_NAME_LENGTH) return { error: MESSAGES.nameLength };

  const birthDate = optional(form.birthDate);
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate < MIN_BIRTH_DATE || birthDate > today)) {
    return { error: MESSAGES.birthDate };
  }

  const phone = form.phone.replace(/\D/g, '');
  if (phone && (phone.length < 10 || phone.length > 13)) return { error: MESSAGES.phone };

  const city = optional(form.city);
  if (city && city.length > MAX_TEXT_LENGTH) return { error: MESSAGES.city };
  const occupation = optional(form.occupation);
  if (occupation && occupation.length > MAX_TEXT_LENGTH) return { error: MESSAGES.occupation };

  const incomeText = optional(form.income);
  const income = incomeText ? parseAmountToCents(incomeText) : null;
  if (incomeText && income === null) return { error: MESSAGES.income };

  const payday = wholeNumber(form.payday, 1, 31);
  if (payday === undefined) return { error: MESSAGES.payday };
  const dependents = wholeNumber(form.dependents, 0, MAX_DEPENDENTS);
  if (dependents === undefined) return { error: MESSAGES.dependents };

  return {
    request: {
      name,
      avatarIcon: form.avatarIcon,
      avatarColor: form.avatarColor,
      birthDate,
      phone: phone || null,
      city,
      state: optional(form.state),
      occupation,
      monthlyIncomeCents: income,
      payday,
      dependents,
      digestByEmail: form.digestByEmail,
    },
  };
}
