// apps/user/components/layout/navbar.tsx
// AmanahHub — Public navigation bar

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/actions';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/charities" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center
                          text-white text-sm font-bold">A</div>
          <span className="font-semibold text-gray-900">AmanahHub</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/charities"
            className="text-sm text-gray-600 hover:text-emerald-700 transition-colors">
            Charities
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/account"
                className="text-sm text-gray-600 hover:text-emerald-700">
                My account
              </Link>
              <form action={signOut}>
                <button type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login"
                className="text-sm text-gray-600 hover:text-emerald-700">
                Sign in
              </Link>
              <Link href="/signup"
                className="text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800
                           px-3 py-1.5 rounded-md transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
