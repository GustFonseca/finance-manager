import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet } from 'react-native';
import { pixelFilters, webStyle } from '@/theme';

type Props = React.ComponentProps<typeof FontAwesome>;

export function PixelIcon({ size = 12, style, ...rest }: Props) {
  const filter = size >= pixelFilters.largeFrom ? styles.large : styles.small;
  return <FontAwesome size={size} {...rest} style={[filter, style]} />;
}

export function PixelFilters() {
  return (
    <svg aria-hidden width={0} height={0} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <PixelFilter id={pixelFilters.small} block={1} />
        <PixelFilter id={pixelFilters.large} block={2} />
      </defs>
    </svg>
  );
}

function PixelFilter({ id, block }: { id: string; block: number }) {
  const steps = Array.from({ length: block - 1 }, (_, index) => index + 1);
  return (
    <filter id={id} x="0" y="0" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceGraphic" result="hard">
        <feFuncA type="discrete" tableValues="0 1 1" />
      </feComponentTransfer>
      <feFlood x="0" y="0" width="1" height="1" />
      <feComposite width={block} height={block} />
      <feTile result="grid" />
      <feComposite in="hard" in2="grid" operator="in" result="dots" />
      {steps.map((step) => (
        <feOffset key={`x${step}`} in="dots" dx={step} result={`dx${step}`} />
      ))}
      <feMerge result="rows">
        <feMergeNode in="dots" />
        {steps.map((step) => (
          <feMergeNode key={step} in={`dx${step}`} />
        ))}
      </feMerge>
      {steps.map((step) => (
        <feOffset key={`y${step}`} in="rows" dy={step} result={`dy${step}`} />
      ))}
      <feMerge>
        <feMergeNode in="rows" />
        {steps.map((step) => (
          <feMergeNode key={step} in={`dy${step}`} />
        ))}
      </feMerge>
    </filter>
  );
}

const styles = StyleSheet.create({
  small: webStyle({ filter: `url(#${pixelFilters.small})` }),
  large: webStyle({ filter: `url(#${pixelFilters.large})` }),
});
