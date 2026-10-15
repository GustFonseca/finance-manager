import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Keeps ScrollView components, rather than the document, owning the scroll. */}
        <ScrollViewStyleReset />

        {/* Painted before hydration so the dark UI never flashes a light background. */}
        <style dangerouslySetInnerHTML={{ __html: rootBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Must stay in sync with `colors.background` in src/theme.
const rootBackground = `
body {
  background-color: #121212;
}`;
