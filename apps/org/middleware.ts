// apps/org/middleware.ts
// amanahOS — Route protection middleware
//
// Protected routes: /dashboard/**, /profile/**, /accounting/**, /projects/**,
//                   /reports/**, /compliance/**, /governance/**, /trust/**
// Auth routes:      /login, /callback
// Public routes:    / (redirects to /login), /no-access, /setup
//
// Redirect loop prevention:
//   The middleware must NOT redirect authenticated users away from /login when
//   an ?error= param is present — the protected layout uses /login?error=...
//   for failure states, and bouncing back to /dashboard causes an infinite loop.

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/accounting',
  '/projects',
  '/reports',
  '/compliance',
  '/governance',
  '/trust',
];

type CookieSetInput = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── 1. Env guard — crash-proof missing .env.local ─────────────────────────
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (
      pathname === '/setup' ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')
    ) return NextResponse.next();
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // ── 2. Always-public paths — never redirect these ─────────────────────────
  // /no-access and /setup must be reachable regardless of auth state.
  // /login with an ?error= param must stay on /login (not bounced to /dashboard).
  const isNoAccess = pathname === '/no-access';
  const isSetup    = pathname === '/setup';
  const isLoginWithError = pathname === '/login' && searchParams.has('error');

  if (isNoAccess || isSetup || isLoginWithError) {
    return NextResponse.next();
  }

  // ── 3. Supabase client ─────────────────────────────────────────────────────
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieSetInput[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // ── 4. Route guards ────────────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isLogin     = pathname === '/login';
  const isCallback  = pathname === '/callback';
  const isRoot      = pathname === '/';

  // Unauthenticated → protected route: send to login
  if (isProtected && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → /login (no error): send to dashboard
  if (isLogin && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root: route based on auth state
  if (isRoot) {
    return NextResponse.redirect(
      new URL(user ? '/dashboard' : '/login', request.url)
    );
  }

  // Callback: always pass through
  if (isCallback) return response;

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
