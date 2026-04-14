// apps/org/middleware.ts
// amanahOS — Route protection middleware
//
// Protected routes: /dashboard/**, /profile/**, /accounting/**, /projects/**,
//                   /reports/**, /compliance/**, /governance/**, /trust/**
// Auth routes:      /login, /callback
// Public routes:    / (redirects to /login)
//
// Access rule: only users with an org membership (org_admin, org_manager, org_viewer)
// may use this app. Reviewers / scholars / super_admin use apps/admin instead.

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

const AUTH_ROUTES = ['/login', '/callback'];

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

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user && pathname !== '/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root redirect
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
