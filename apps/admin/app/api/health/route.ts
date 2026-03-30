// apps/admin/app/api/health/route.ts
// AmanahHub Console — Health check endpoint

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const start  = Date.now();
  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string }> = {};

  // ── Database ──────────────────────────────────────────────
  try {
    const supabase = await createClient();
    const dbStart  = Date.now();
    const { error } = await supabase
      .from('organizations').select('id').limit(1);
    checks.database = {
      ok:         !error,
      latency_ms: Date.now() - dbStart,
      error:      error?.message,
    };
  } catch (err: any) {
    checks.database = { ok: false, error: err.message };
  }

  // ── Environment ───────────────────────────────────────────
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missing = required.filter((k) => !process.env[k]);
  checks.environment = {
    ok:    missing.length === 0,
    error: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
  };

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok:         allOk,
      app:        'AmanahHub Console',
      version:    process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      timestamp:  new Date().toISOString(),
      latency_ms: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
