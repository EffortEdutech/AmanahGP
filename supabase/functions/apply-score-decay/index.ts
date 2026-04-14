// supabase/functions/apply-score-decay/index.ts
// Sprint 19 — Trust Event Engine
// Supabase Edge Function — applies monthly score decay to all active orgs.
//
// Schedule via Supabase Dashboard → Edge Functions → Schedules:
//   Cron: 0 2 1 * *   (2am on the 1st of every month)
//
// Decay rates (from amanah_gp_OS.md):
//   Financial  : -3/month if no positive FI event in last 30 days
//   Governance : -2/month if no positive GOV event
//   Compliance : -4/month if no positive COM event
//   Transparency: -3/month if no positive TRN event
//   Impact     : -2/month if no positive IMP event

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl     = Deno.env.get('SUPABASE_URL')!;
const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Allow manual trigger via POST or scheduled trigger
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(supabaseUrl, supabaseService);

  // Get all active orgs that have at least one trust event (are using v2 engine)
  const { data: activeOrgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('listing_status', 'listed');

  if (orgsError) {
    console.error('Failed to load orgs:', orgsError.message);
    return new Response(JSON.stringify({ error: orgsError.message }), { status: 500 });
  }

  const results: Array<{ orgId: string; name: string; status: string }> = [];

  for (const org of (activeOrgs ?? [])) {
    const { error } = await supabase.rpc('apply_score_decay', {
      p_org_id: org.id,
    });

    results.push({
      orgId:  org.id,
      name:   org.name,
      status: error ? `error: ${error.message}` : 'decay applied',
    });

    if (error) {
      console.error(`Decay failed for org ${org.id}:`, error.message);
    }
  }

  console.log(`Score decay applied to ${results.length} organisations.`);

  return new Response(
    JSON.stringify({
      success:      true,
      processed:    results.length,
      applied_at:   new Date().toISOString(),
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
