// apps/org/components/ui/coming-soon-module.tsx
// amanahOS — Coming soon module placeholder
// Used on stub pages while full functionality is built in future sprints.

interface ComingSoonModuleProps {
  label: string;
  sprintTarget: string;
  description: string;
  consoleLink?: boolean;
}

export function ComingSoonModule({
  label,
  sprintTarget,
  description,
  consoleLink = false,
}: ComingSoonModuleProps) {
  const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';

  return (
    <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-emerald-600 text-sm">⊙</span>
        <span className="text-[12px] font-semibold text-emerald-800">
          {label} — coming in {sprintTarget}
        </span>
      </div>
      <p className="text-[12px] text-emerald-700 leading-relaxed">{description}</p>
      {consoleLink && (
        <a
          href={consoleUrl}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700
                     hover:text-emerald-900 transition-colors"
        >
          Use AmanahHub Console in the meantime
          <span>↗</span>
        </a>
      )}
    </div>
  );
}
