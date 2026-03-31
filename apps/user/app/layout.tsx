// apps/user/app/layout.tsx
// AmanahHub — Root layout with tabbed navbar (Sprint 10)

import type { Metadata } from 'next';
import './globals.css';
import { createClient }   from '@/lib/supabase/server';
import { NavbarClient }   from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: {
    default:  'AmanahHub — Trusted Giving. Transparent Governance.',
    template: '%s | AmanahHub',
  },
  description:
    'Discover verified Malaysian Islamic charities. Every organization is independently evaluated on transparency, governance, and impact.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('auth_provider_user_id', user.id)
      .single();
    displayName = profile?.display_name ?? user.email?.split('@')[0];
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        <NavbarClient isLoggedIn={!!user} displayName={displayName} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center
                            text-white text-sm font-bold">A</div>
            <span className="font-display text-white font-bold text-[15px]">AmanahHub</span>
          </div>
          <p className="text-[12px] leading-relaxed text-gray-500">
            Trusted Giving. Transparent Governance.
          </p>
          <p className="text-[11px] text-gray-600 mt-2">
            Part of Amanah Governance Platform
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-3">Donors</p>
          <nav className="space-y-2">
            {[
              ['/charities', 'Browse charities'],
              ['/how-it-works', 'How it works'],
              ['/about', 'About AmanahHub'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                className="block text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-3">Organizations</p>
          <nav className="space-y-2">
            {[
              ['https://console.amanahhub.my', 'AmanahHub Console'],
              ['/how-it-works#ctcf', 'CTCF Certification'],
              ['/how-it-works#amanah', 'Amanah Index™'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                className="block text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-3">Help</p>
          <nav className="space-y-2">
            {[
              ['/support', 'Support & FAQ'],
              ['/support#contact', 'Contact us'],
              ['/about#privacy', 'Privacy policy'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                className="block text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row
                      items-center justify-between gap-3">
        <p className="text-[11px] text-gray-600">
          © {new Date().getFullYear()} Amanah Governance Platform. All rights reserved.
        </p>
        <p className="text-[11px] text-gray-600 text-center">
          AmanahHub is non-custodial. Donations go directly to charities via their payment gateways.
        </p>
      </div>
    </footer>
  );
}
