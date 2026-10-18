import React from 'react';
import { colors } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  accessibilityLabel?: string;
};

export function Checkbox({ checked, onChange, label, accessibilityLabel }: Props) {
  const box = (
    <input
      type="checkbox"
      checked={checked}
      aria-label={accessibilityLabel}
      onChange={(event) => onChange(event.target.checked)}
      style={boxStyle}
    />
  );
  if (!label) return box;
  return (
    <label style={labelStyle}>
      {box}
      {label}
    </label>
  );
}

const boxStyle: React.CSSProperties = { accentColor: colors.primary, cursor: 'pointer', margin: 0 };

const labelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  cursor: 'pointer',
};
