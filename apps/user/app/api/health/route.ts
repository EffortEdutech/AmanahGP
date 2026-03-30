// apps/user/app/api/health/route.ts
// AmanahHub — Health check endpoint
// Used by monitoring, load balancers, and go-live smoke tests

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string }> = {};

  // ── Database connectivity ─────────────────────────────────
  try {
    const supabase = await createClient();
    const dbStart  = Date.now();
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    checks.database = {
      ok:         !error,
      latency_ms: Date.now() - dbStart,
      error:      error?.message,
    };
  } catch (err: any) {
    checks.database = { ok: false, error: err.message };
  }

  // ── Environment check ─────────────────────────────────────
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missingEnv = requiredEnvVars.filter((k) => !process.env[k]);
  checks.environment = {
    ok:    missingEnv.length === 0,
    error: missingEnv.length > 0 ? `Missing: ${missingEnv.join(', ')}` : undefined,
  };

  const allOk      = Object.values(checks).every((c) => c.ok);
  const totalMs    = Date.now() - start;
  const statusCode = allOk ? 200 : 503;

  return NextResponse.json(
    {
      ok:         allOk,
      app:        'AmanahHub',
      version:    process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      timestamp:  new Date().toISOString(),
      latency_ms: totalMs,
      checks,
    },
    { status: statusCode }
  );
}
