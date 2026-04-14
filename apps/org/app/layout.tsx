// apps/org/app/layout.tsx
// amanahOS — Root layout

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'amanahOS',
    template: '%s | amanahOS',
  },
  description: 'Governance Workspace for Islamic Nonprofits — Amanah Governance Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
