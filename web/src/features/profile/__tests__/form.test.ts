import { formatCentsForInput } from '@/lib/money';
import {
  AVATAR_COLORS,
  AVATAR_ICONS,
  BRAZILIAN_STATES,
  formatPhone,
  MESSAGES,
  ProfileForm,
  toForm,
  validateProfile,
} from '../form';
import { profile } from './fixtures';

const TODAY = '2026-10-19';

function form(overrides: Partial<ProfileForm> = {}): ProfileForm {
  return { ...toForm(profile()), ...overrides };
}

function errorOf(overrides: Partial<ProfileForm>) {
  const result = validateProfile(form(overrides), TODAY);
  return 'error' in result ? result.error : null;
}

function requestOf(overrides: Partial<ProfileForm>) {
  const result = validateProfile(form(overrides), TODAY);
  if ('error' in result) throw new Error(result.error);
  return result.request;
}

describe('profile form options', () => {
  it('offers about thirty distinct icons, palette colors and the 27 states', () => {
    expect(AVATAR_ICONS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(AVATAR_ICONS).size).toBe(AVATAR_ICONS.length);
    expect(AVATAR_COLORS.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
    expect(BRAZILIAN_STATES).toHaveLength(27);
    expect(BRAZILIAN_STATES.map((state) => state.uf)).toContain('DF');
  });
});

describe('formatPhone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['11', '(11'],
    ['119', '(11) 9'],
    ['1191234', '(11) 9123-4'],
    ['1131234567', '(11) 3123-4567'],
    ['11912345678', '(11) 91234-5678'],
    ['(11) 91234-56789', '+1 (19) 12345-6789'],
    ['5511912345678', '+55 (11) 91234-5678'],
    ['55119123456789', '+55 (11) 91234-5678'],
  ])('formats %p as %p', (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });
});

describe('toForm', () => {
  it('turns empty fields into blank inputs', () => {
    expect(toForm(profile())).toEqual({
      name: 'Gustavo',
      avatarIcon: null,
      avatarColor: null,
      birthDate: '',
      phone: '',
      city: '',
      state: '',
      occupation: '',
      income: '',
      payday: '',
      dependents: '',
      digestByEmail: false,
    });
  });

  it('formats the stored values for editing', () => {
    const filled = profile({
      avatarIcon: 'rocket',
      avatarColor: '#357263',
      birthDate: '1990-05-10T00:00:00Z',
      phone: '11912345678',
      city: 'Campinas',
      state: 'SP',
      occupation: 'Dev',
      monthlyIncomeCents: 350000,
      payday: 5,
      dependents: 0,
      digestByEmail: true,
    });

    expect(toForm(filled)).toEqual({
      name: 'Gustavo',
      avatarIcon: 'rocket',
      avatarColor: '#357263',
      birthDate: '1990-05-10',
      phone: '(11) 91234-5678',
      city: 'Campinas',
      state: 'SP',
      occupation: 'Dev',
      income: formatCentsForInput(350000),
      payday: '5',
      dependents: '0',
      digestByEmail: true,
    });
  });
});

describe('validateProfile', () => {
  it('sends blanks as null and trims the text', () => {
    expect(requestOf({ name: '  Gustavo  ', city: '   ', occupation: '' })).toEqual({
      name: 'Gustavo',
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
    });
  });

  it('converts the filled fields to what the API expects', () => {
    expect(
      requestOf({
        avatarIcon: 'paw',
        avatarColor: '#9A6A8E',
        birthDate: '1990-05-10',
        phone: '(11) 91234-5678',
        city: ' Campinas ',
        state: 'SP',
        occupation: 'Dev',
        income: '3.500,50',
        payday: '31',
        dependents: '20',
        digestByEmail: true,
      })
    ).toEqual({
      name: 'Gustavo',
      avatarIcon: 'paw',
      avatarColor: '#9A6A8E',
      birthDate: '1990-05-10',
      phone: '11912345678',
      city: 'Campinas',
      state: 'SP',
      occupation: 'Dev',
      monthlyIncomeCents: 350050,
      payday: 31,
      dependents: 20,
      digestByEmail: true,
    });
  });

  it('accepts the limits', () => {
    expect(requestOf({ birthDate: '1900-01-01' }).birthDate).toBe('1900-01-01');
    expect(requestOf({ birthDate: TODAY }).birthDate).toBe(TODAY);
    expect(requestOf({ phone: '1131234567' }).phone).toBe('1131234567');
    expect(requestOf({ phone: '+55 (11) 91234-5678' }).phone).toBe('5511912345678');
    expect(requestOf({ income: '0' }).monthlyIncomeCents).toBe(0);
    expect(requestOf({ payday: '1', dependents: '0' })).toMatchObject({ payday: 1, dependents: 0 });
    expect(requestOf({ name: 'a'.repeat(100), city: 'c'.repeat(100), occupation: 'o'.repeat(100) }).name).toHaveLength(100);
  });

  it.each<[string, Partial<ProfileForm>, string]>([
    ['a blank name', { name: '   ' }, MESSAGES.name],
    ['a long name', { name: 'a'.repeat(101) }, MESSAGES.nameLength],
    ['a birth date before 1900', { birthDate: '1899-12-31' }, MESSAGES.birthDate],
    ['a birth date in the future', { birthDate: '2026-10-20' }, MESSAGES.birthDate],
    ['a malformed birth date', { birthDate: '10/05/1990' }, MESSAGES.birthDate],
    ['a short phone', { phone: '(11) 9123-456' }, MESSAGES.phone],
    ['a long phone', { phone: '55119123456789' }, MESSAGES.phone],
    ['a long city', { city: 'c'.repeat(101) }, MESSAGES.city],
    ['a long occupation', { occupation: 'o'.repeat(101) }, MESSAGES.occupation],
    ['an invalid income', { income: 'muito' }, MESSAGES.income],
    ['a negative income', { income: '-100,00' }, MESSAGES.income],
    ['payday zero', { payday: '0' }, MESSAGES.payday],
    ['payday 32', { payday: '32' }, MESSAGES.payday],
    ['a fractional payday', { payday: '5.5' }, MESSAGES.payday],
    ['too many dependents', { dependents: '21' }, MESSAGES.dependents],
    ['negative dependents', { dependents: '-1' }, MESSAGES.dependents],
  ])('rejects %s', (_, overrides, message) => {
    expect(errorOf(overrides)).toBe(message);
  });
});
