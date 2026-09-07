'use client';

import type { Character, CrimeDefinition, CrimeSeverity } from '@/lib/types';
import { crimeSuccessChance } from '@/lib/engine/crime';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SEVERITY_CLASSES: Record<CrimeSeverity, string> = {
  petty: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  serious: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  major: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function CrimeCard({
  crime,
  character,
  onAttempt,
}: {
  crime: CrimeDefinition;
  character: Character;
  onAttempt: (crimeId: string) => void;
}) {
  const successPct = Math.round(crimeSuccessChance(character, crime) * 100);

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-neutral-900 dark:text-white">{crime.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_CLASSES[crime.severity]}`}>
            {crime.severity}
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          ${crime.rewardMin.toLocaleString()}–${crime.rewardMax.toLocaleString()} · {successPct}% success
        </p>
      </div>
      <Button variant="danger" onClick={() => onAttempt(crime.id)}>
        Attempt
      </Button>
    </Card>
  );
}
