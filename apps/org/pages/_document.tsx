// apps/org/pages/_document.tsx
// Minimal Pages Router document for amanahOS.
// This stabilises Next.js build when the compiler asks for the internal /_document page
// while the app mainly uses the App Router under app/.

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
