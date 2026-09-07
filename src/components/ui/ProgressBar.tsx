interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  colorClass: string;
}

export function ProgressBar({ label, value, colorClass }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs font-medium text-ink-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
