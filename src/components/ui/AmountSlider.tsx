interface AmountSliderProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function AmountSlider({ label, value, max, onChange }: AmountSliderProps) {
  const clampedMax = Math.max(1, Math.floor(max));
  const clampedValue = Math.min(Math.max(1, value), clampedMax);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-semibold text-ink tabular-nums">${clampedValue.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={1}
        max={clampedMax}
        value={clampedValue}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={clampedMax <= 1}
        className="w-full accent-[var(--accent)] disabled:opacity-40"
      />
      <div className="flex justify-between text-[10px] text-ink-muted">
        <span>$1</span>
        <span>${clampedMax.toLocaleString()}</span>
      </div>
    </div>
  );
}
