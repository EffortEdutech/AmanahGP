// apps/user/app/layout.tsx
// AmanahHub — Root layout with public navbar

import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: { default: 'AmanahHub', template: '%s | AmanahHub' },
  description: 'Trusted Giving. Transparent Governance. Malaysia\'s Islamic charity transparency platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-gray-200 bg-white py-8">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              AmanahHub is part of{' '}
              <span className="font-medium text-gray-500">Amanah Governance Platform</span>.
              {' '}Trusted Giving. Transparent Governance.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
