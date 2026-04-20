import { TrustPillarPanel as UiTrustPillarPanel } from '@/components/ui/trust-panel';

type PillarData = {
  key: string;
  publicLabel: string;
  pct: number;
};

type LooseProps = {
  pillars?: PillarData[] | null;
  pillarBreakdown?: PillarData[] | null;
  breakdown?: PillarData[] | null;
};

export function TrustPillarPanel(props: LooseProps) {
  const pillars =
    props.pillars ??
    props.pillarBreakdown ??
    props.breakdown ??
    [];

  return <UiTrustPillarPanel pillars={Array.isArray(pillars) ? pillars : []} />;
}
