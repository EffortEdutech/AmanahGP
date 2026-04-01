// apps/admin/middleware.ts
// AmanahHub Console — Route protection middleware
//
// Protected routes: /dashboard/**, /orgs/**, /onboarding/**
// Auth routes:      /login, /signup, /callback
// Public routes:    / (redirects to /login)

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/orgs', '/onboarding', '/admin'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/callback'];

type CookieSetInput = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSetInput[]) {
          cookiesToSet.forEach(({ name, value }: CookieSetInput) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieSetInput) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user && pathname !== '/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/') {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};