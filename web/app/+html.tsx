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

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// `colors.desktop` and `fonts.body` in src/theme must stay in sync with these.
// The font rule outranks react-native-web's default `System` font class, while
// inline styles (icon fonts, window titles) still win over it.
const globalStyles = `
body {
  background-color: #3A6EA5;
}
html body [dir], html body input, html body textarea, html body select {
  font-family: Tahoma, "Segoe UI", Verdana, sans-serif;
}`;
