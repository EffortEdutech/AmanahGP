// apps/user/lib/audit.ts
// AmanahHub Console — Audit log helper (server-side only)
// Use in Server Actions and Route Handlers to write to audit_logs
// NEVER call from client components

import { createServiceClient } from '@/lib/supabase/server';
import type { AuditAction } from '@agp/config';

interface AuditParams {
  actorUserId:    string | null;
  actorRole:      string | null;
  organizationId: string | null;
  action:         AuditAction | string;
  entityTable:    string | null;
  entityId:       string | null;
  metadata?:      Record<string, unknown>;
  ipAddress?:     string;
  userAgent?:     string;
}

/**
 * Writes an append-only audit log entry.
 * Uses service role to bypass RLS — must only be called server-side.
 * Failures are caught and logged to console to never block the main flow.
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id:    params.actorUserId,
        actor_role:       params.actorRole,
        organization_id:  params.organizationId,
        action:           params.action,
        entity_table:     params.entityTable,
        entity_id:        params.entityId,
        metadata:         params.metadata ?? {},
        ip_address:       params.ipAddress ?? null,
        user_agent:       params.userAgent ?? null,
      });

    if (error) {
      console.error('[audit] Failed to write audit log:', error.message, {
        action: params.action,
        entityId: params.entityId,
      });
    }
  } catch (err) {
    // Audit log failure must never break the calling operation
    console.error('[audit] Unexpected error writing audit log:', err);
  }
}
