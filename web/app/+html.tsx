import { ScrollViewStyleReset } from 'expo-router/html';
import { colors } from '@/theme';

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

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
body {
  background-color: ${colors.desktop};
}
html body [dir], html body input, html body textarea, html body select {
  font-family: Tahoma, "Segoe UI", Verdana, sans-serif;
}`;
