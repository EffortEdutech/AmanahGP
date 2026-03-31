// components/layout/navbar.tsx
// AmanahHub — Compact sticky topbar (Sprint 7 UI uplift)
// Matches UAT .topbar pattern: 46px, sticky, logo + appname + auth links

import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut }      from '@/app/(auth)/actions';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 h-[46px] bg-white border-b border-gray-200
                       flex items-center px-4 gap-3">

      {/* Brand */}
      <Link href="/charities" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center
                        text-white text-xs font-medium flex-shrink-0 select-none">
          A
        </div>
        <span className="text-[13px] font-medium text-gray-900">AmanahHub</span>
      </Link>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-200 flex-shrink-0" />

      {/* Nav pills */}
      <nav className="flex items-center gap-1 flex-1">
        <NavLink href="/charities" label="Directory" />
      </nav>

      {/* Auth area */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {user ? (
          <>
            <Link href="/account"
              className="px-3 py-1 rounded-full text-[11px] font-medium
                         text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              My account
            </Link>
            <form action={signOut}>
              <button type="submit"
                className="px-3 py-1 rounded-full text-[11px] font-medium
                           text-gray-400 hover:text-gray-600 transition-colors">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login"
              className="px-3 py-1 rounded-full text-[11px] font-medium
                         text-gray-600 hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="px-3 py-1 rounded-full text-[11px] font-medium
                         text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  // Server component can't use usePathname — highlighting done via CSS
  // We rely on active link styling from the parent layout if needed
  return (
    <Link
      href={href}
      className="px-3 py-1 rounded-full text-[11px] font-medium
                 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      {label}
    </Link>
  );
}
