import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { NavbarClient } from '@/components/layout/navbar';
import { MissionTaglineBar } from '@/components/site/mission-tagline-bar';

export const metadata: Metadata = {
  title: {
    default: 'AmanahHub — Trusted Giving. Transparent Governance.',
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <MissionTaglineBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 px-4 py-12 text-gray-400">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              A
            </div>
            <span className="font-display text-[15px] font-bold text-white">AmanahHub</span>
          </div>
          <p className="text-[12px] leading-relaxed text-gray-500">
            Trusted Giving. Transparent Governance.
          </p>
          <p className="mt-2 text-[11px] text-gray-600">Part of Amanah Governance Platform</p>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-gray-300">Donors</p>
          <nav className="space-y-2">
            {[
              ['/charities', 'Browse charities'],
              ['/how-it-works', 'How it works'],
              ['/about', 'About AmanahHub'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block text-[12px] text-gray-500 transition-colors hover:text-gray-300"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-gray-300">
            Organizations
          </p>
          <nav className="space-y-2">
            {[
              ['https://console.amanahhub.my', 'AmanahHub Console'],
              ['/how-it-works#ctcf', 'CTCF Certification'],
              ['/how-it-works#amanah', 'Amanah Index™'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block text-[12px] text-gray-500 transition-colors hover:text-gray-300"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-gray-300">Help</p>
          <nav className="space-y-2">
            {[
              ['/support', 'Support & FAQ'],
              ['/support#contact', 'Contact us'],
              ['/about#privacy', 'Privacy policy'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block text-[12px] text-gray-500 transition-colors hover:text-gray-300"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 md:flex-row">
        <p className="text-[11px] text-gray-600">
          © {new Date().getFullYear()} Amanah Governance Platform. All rights reserved.
        </p>
        <p className="text-center text-[11px] text-gray-600">
          AmanahHub is non-custodial. Donations go directly to charities via their payment gateways.
        </p>
      </div>
    </footer>
  );
}
