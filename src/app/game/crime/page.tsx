'use client';

import { useGameStore } from '@/lib/store';
import { CRIME_CATALOG } from '@/lib/data/crimes';
import { CrimeCard } from '@/components/game/CrimeCard';
import { Card } from '@/components/ui/Card';

export default function CrimePage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const commitCrime = useGameStore((state) => state.commitCrime);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  if (character.criminalRecord.inJail) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Card className="space-y-2">
          <p className="font-semibold text-neutral-900 dark:text-white">Behind Bars</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            You&apos;re serving time and can&apos;t do much else right now.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Convictions: {character.criminalRecord.convictions} · Years left: {character.criminalRecord.yearsLeft}
          </p>
        </Card>
      </div>
    );
  }

  const availableCrimes = CRIME_CATALOG.filter((crime) => character.age >= crime.minAge);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Crime pays until it doesn&apos;t. Higher rewards mean higher risk of getting caught.
      </p>
      {availableCrimes.map((crime) => (
        <CrimeCard key={crime.id} crime={crime} character={character} onAttempt={commitCrime} />
      ))}
      {availableCrimes.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Nothing available at your age yet.</p>
      )}
    </div>
  );
}
