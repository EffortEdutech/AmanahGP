// apps/admin/app/(auth)/callback/route.ts
// AmanahHub Console — Supabase Auth callback handler
// Handles: email confirmation, OAuth, password reset redirects

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password recovery: redirect to reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('[callback] exchangeCodeForSession error:', error.message);
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}
