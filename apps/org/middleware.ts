// apps/org/middleware.ts — Sprint 16 Revised
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/accounting',      // covers all /accounting/* sub-routes
  '/projects',
  '/reports',
  '/compliance',
  '/policy-kit',
  '/trust',
  '/certification',
  '/members',
];

type CookieSetInput = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname === '/setup' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  const isNoAccess       = pathname === '/no-access';
  const isSetup          = pathname === '/setup';
  const isLoginWithError = pathname === '/login' && searchParams.has('error');
  if (isNoAccess || isSetup || isLoginWithError) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
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

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isLogin     = pathname === '/login';
  const isRoot      = pathname === '/';

  if (isProtected && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (isLogin && user) return NextResponse.redirect(new URL('/dashboard', request.url));
  if (isRoot)          return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url));

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
