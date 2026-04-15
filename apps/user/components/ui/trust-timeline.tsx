// apps/user/components/ui/trust-timeline.tsx
// AmanahHub — Public Trust Timeline
// Sprint 24
//
// Shows recent trust events in a chronological feed visible to donors.
// Only positive governance signals are shown — negative events are internal.
// Answers donor question: "Are they consistently transparent?"

interface TrustEvent {
  id:         string;
  label:      string;
  pillar:     string;
  positive:   boolean;
  occurredAt: string;
}

interface TrustTimelineProps {
  events: TrustEvent[];
}

const PILLAR_DOT: Record<string, string> = {
  'Financial Integrity': 'bg-emerald-500',
  'Governance':          'bg-blue-500',
  'Compliance':          'bg-purple-500',
  'Transparency':        'bg-teal-500',
  'Impact':              'bg-amber-500',
};

const PILLAR_TEXT: Record<string, string> = {
  'Financial Integrity': 'text-emerald-700',
  'Governance':          'text-blue-700',
  'Compliance':          'text-purple-700',
  'Transparency':        'text-teal-700',
  'Impact':              'text-amber-700',
};

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByMonth(events: TrustEvent[]): Array<{ month: string; events: TrustEvent[] }> {
  const groups = new Map<string, TrustEvent[]>();
  for (const e of events) {
    const key = new Date(e.occurredAt).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).map(([month, evts]) => ({ month, events: evts }));
}

export function TrustTimeline({ events }: TrustTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-[12px] font-semibold text-gray-700 mb-3">Governance timeline</p>
        <p className="text-[12px] text-gray-400 text-center py-4">
          No public governance events recorded yet.
        </p>
      </div>
    );
  }

  const grouped = groupByMonth(events);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-gray-700">Governance timeline</p>
        <p className="text-[10px] text-gray-400">Live from operational data</p>
      </div>

      <div className="space-y-5">
        {grouped.map(({ month, events: monthEvents }) => (
          <div key={month}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              {month}
            </p>
            <div className="space-y-3">
              {monthEvents.map((event) => {
                const dotColor  = PILLAR_DOT[event.pillar]  ?? 'bg-gray-300';
                const textColor = PILLAR_TEXT[event.pillar] ?? 'text-gray-600';
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 mt-1 flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-800 leading-snug">
                        {event.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-medium ${textColor}`}>
                          {event.pillar}
                        </span>
                        <span className="text-[9px] text-gray-300">·</span>
                        <span className="text-[9px] text-gray-400">
                          {formatEventDate(event.occurredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          This timeline shows real governance activities recorded on the Amanah platform.
          Each entry reflects an actual action taken by the organisation — not a self-report.
        </p>
      </div>
    </div>
  );
}
