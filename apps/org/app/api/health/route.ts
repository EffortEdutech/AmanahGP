// apps/org/app/api/health/route.ts
// amanahOS — Health check endpoint
// GET /api/health → { status: 'ok', app: 'amanahOS', ts: '...' }

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'amanahOS',
    version: '0.2.0',
    platform: 'Amanah Governance Platform',
    ts: new Date().toISOString(),
  });
}
