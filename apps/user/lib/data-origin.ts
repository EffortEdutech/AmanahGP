import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicTrustProfile } from '@/lib/public-trust';

export type DataOrigin = 'actual' | 'seed' | 'demo' | 'test';
export type DatasetMode = 'actual' | 'seed' | 'all';

const DATASET_MODES: DatasetMode[] = ['actual', 'seed', 'all'];

export function isLiveAmanahHub() {
  return process.env.VERCEL_ENV === 'production';
}

export async function canCurrentUserViewSeedData(supabase: SupabaseClient) {
  if (!isLiveAmanahHub()) return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('users')
    .select('platform_role')
    .eq('auth_provider_user_id', user.id)
    .maybeSingle();

  if (error) return false;
  return String((data as any)?.platform_role ?? '') === 'super_admin';
}

export function resolveDatasetMode(value: string | null | undefined, canViewSeedData = !isLiveAmanahHub()): DatasetMode {
  if (!canViewSeedData) return 'actual';
  if (value && DATASET_MODES.includes(value as DatasetMode)) return value as DatasetMode;
  return 'actual';
}

export function datasetQuerySuffix(mode: DatasetMode, canViewSeedData = !isLiveAmanahHub()) {
  return canViewSeedData && mode !== 'actual' ? `?dataset=${mode}` : '';
}

export async function filterProfilesByDataset(
  supabase: SupabaseClient,
  profiles: PublicTrustProfile[],
  mode: DatasetMode,
) {
  if (mode === 'all' || profiles.length === 0) return profiles;

  const orgIds = profiles.map((profile) => profile.organization_id).filter(Boolean);
  const { data, error } = await supabase
    .from('organizations')
    .select('id, data_origin')
    .in('id', orgIds);

  if (error) throw new Error(error.message);

  const originByOrg = new Map((data ?? []).map((row: any) => [String(row.id), String(row.data_origin ?? 'actual')]));
  return profiles.filter((profile) => {
    const origin = originByOrg.get(profile.organization_id) ?? 'actual';
    return mode === 'seed' ? origin === 'seed' : origin === 'actual';
  });
}

export async function isOrganizationVisibleForDataset(
  supabase: SupabaseClient,
  organizationId: string,
  mode: DatasetMode,
) {
  if (mode === 'all') return true;

  const { data, error } = await supabase
    .from('organizations')
    .select('id, data_origin')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const origin = String((data as any)?.data_origin ?? 'actual');
  return mode === 'seed' ? origin === 'seed' : origin === 'actual';
}
