interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  colorClass: string;
}

export function ProgressBar({ label, value, colorClass }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
