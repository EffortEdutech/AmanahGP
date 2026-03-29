import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AmanahHub Console',
  description: 'Amanah Governance Platform — Operations Workspace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
