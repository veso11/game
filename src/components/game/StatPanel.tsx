import type { Character } from '@/lib/types';

const STATS: { key: keyof Character; label: string }[] = [
  { key: 'health', label: 'Health' },
  { key: 'happiness', label: 'Happiness' },
  { key: 'smarts', label: 'Smarts' },
  { key: 'looks', label: 'Looks' },
  { key: 'talent', label: 'Talent' },
];

function StatLine({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-medium text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink tabular-nums">{pct}%</span>
    </div>
  );
}

export function StatPanel({ character }: { character: Character }) {
  return (
    <div className="space-y-1.5 border-t border-border bg-surface px-4 py-3">
      {STATS.map(({ key, label }) => (
        <StatLine
          key={key}
          label={label}
          value={(character[key] as number) ?? 50}
          color={key === 'talent' ? 'var(--gold)' : '#3f9c5c'}
        />
      ))}
    </div>
  );
}
