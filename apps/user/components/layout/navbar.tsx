'use client';
// apps/user/components/layout/navbar.tsx
// AmanahHub — Public tabbed navbar (Sprint 10)
// Tabs: Home · Directory · How It Works · About · Support
// Auth-aware: shows Sign in / Sign up OR My account / Sign out

import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import { useState }   from 'react';
import { MissionTaglineBar } from '@/components/site/mission-tagline-bar';

interface NavbarClientProps {
  isLoggedIn:  boolean;
  displayName?: string;
}

const TABS = [
  { href: '/',              label: 'Home'         },
  { href: '/charities',     label: 'Directory'    },
  { href: '/how-it-works',  label: 'How It Works' },
  { href: '/about',         label: 'About'        },
  { href: '/support',       label: 'Support'      },
];

export function NavbarClient({ isLoggedIn, displayName }: NavbarClientProps) {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <MissionTaglineBar />
      <div className="max-w-6xl mx-auto px-4 h-[52px] flex items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <div className="w-7 h-7 rounded-md bg-emerald-700 flex items-center justify-center
                          text-white text-sm font-bold select-none">A</div>
          <span className="font-display text-[15px] font-bold text-gray-900 tracking-tight">
            AmanahHub
          </span>
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                isActive(tab.href)
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 ml-auto">
          {isLoggedIn ? (
            <>
              <Link href="/account"
                className="text-[12px] font-medium text-gray-600 hover:text-gray-900
                           px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                {displayName ?? 'My account'}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-[12px] font-medium text-gray-600 hover:text-gray-900
                           px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                Sign in
              </Link>
              <Link href="/charities"
                className="text-[12px] font-medium text-white bg-emerald-700
                           hover:bg-emerald-800 px-4 py-1.5 rounded-lg transition-colors">
                Browse charities
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-2 text-gray-500 hover:text-gray-900"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-[13px] font-medium ${
                isActive(tab.href)
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {isLoggedIn ? (
              <Link href="/account" className="btn-secondary text-xs flex-1 justify-center">
                My account
              </Link>
            ) : (
              <>
                <Link href="/login"   className="btn-secondary text-xs flex-1 justify-center">Sign in</Link>
                <Link href="/charities" className="btn-primary text-xs flex-1 justify-center">Browse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
