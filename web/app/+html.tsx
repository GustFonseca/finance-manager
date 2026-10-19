import { ScrollViewStyleReset } from 'expo-router/html';
import { PixelFilters } from '@/components/ui/PixelIcon';
import { colors, fonts } from '@/theme';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={colors.windowFrame} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap" rel="stylesheet" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        <PixelFilters />
        {children}
      </body>
    </html>
  );
}

const globalStyles = `
@font-face {
  font-family: "Pixel Digits";
  src: url(https://fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2isfFJU.woff2) format("woff2");
  unicode-range: U+002C, U+002E, U+0030-0039;
  size-adjust: 125%;
  font-display: swap;
}
body {
  background-color: ${colors.desktop};
}
html, body, html body [dir], html body input, html body textarea, html body select, html body button {
  font-family: ${fonts.body};
  -webkit-font-smoothing: none;
  font-smooth: never;
  text-rendering: optimizeSpeed;
}
img, canvas, svg, [role="img"] {
  image-rendering: pixelated;
}`;
