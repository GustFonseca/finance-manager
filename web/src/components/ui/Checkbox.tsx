import React from 'react';
import { bevels, colors, fontSize, glyphs } from '@/theme';

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
      style={checked ? checkedStyle : boxStyle}
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

const boxStyle: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  width: 11,
  height: 11,
  flexShrink: 0,
  margin: 2,
  backgroundColor: colors.surface,
  backgroundRepeat: 'no-repeat',
  boxShadow: bevels.radio,
  cursor: 'pointer',
};

const checkedStyle: React.CSSProperties = { ...boxStyle, backgroundImage: glyphs.check };

const labelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: fontSize.sm,
  cursor: 'pointer',
};
