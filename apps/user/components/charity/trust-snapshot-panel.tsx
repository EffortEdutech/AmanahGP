import { TrustSnapshotPanel as UiTrustSnapshotPanel } from '@/components/ui/trust-panel';

type SnapshotSignal = {
  label: string;
  detail: string;
  ok: boolean;
};

type LooseProps = {
  signals?: SnapshotSignal[] | null;
  snapshotSignals?: SnapshotSignal[] | null;
  snapshot?: { signals?: SnapshotSignal[] | null } | null;
  orgName?: string | null;
  organizationName?: string | null;
  name?: string | null;
};

export function TrustSnapshotPanel(props: LooseProps) {
  const signals =
    props.signals ??
    props.snapshotSignals ??
    props.snapshot?.signals ??
    [];

  const orgName =
    props.orgName ??
    props.organizationName ??
    props.name ??
    'this organisation';

  return <UiTrustSnapshotPanel signals={Array.isArray(signals) ? signals : []} orgName={orgName} />;
}
