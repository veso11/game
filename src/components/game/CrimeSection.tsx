'use client';

import { useGameStore } from '@/lib/store';
import { CRIME_CATALOG } from '@/lib/data/crimes';
import { CrimeCard } from '@/components/game/CrimeCard';
import { Card } from '@/components/ui/Card';
import type { Character } from '@/lib/types';

export function CrimeSection({ character }: { character: Character }) {
  const commitCrime = useGameStore((state) => state.commitCrime);

  if (character.criminalRecord.inJail) {
    return (
      <Card className="space-y-2">
        <p className="font-semibold text-ink">Behind Bars</p>
        <p className="text-sm text-ink-muted">
          You&apos;re serving time and can&apos;t do much else right now.
        </p>
        <p className="text-xs text-ink-muted">
          Convictions: {character.criminalRecord.convictions} · Years left: {character.criminalRecord.yearsLeft}
        </p>
      </Card>
    );
  }

  const availableCrimes = CRIME_CATALOG.filter((crime) => character.age >= crime.minAge);

  return (
    <>
      <p className="text-sm text-ink-muted">
        Crime pays until it doesn&apos;t. Higher rewards mean higher risk of getting caught.
      </p>
      {availableCrimes.map((crime) => (
        <CrimeCard key={crime.id} crime={crime} character={character} onAttempt={commitCrime} />
      ))}
      {availableCrimes.length === 0 && (
        <p className="text-sm text-ink-muted">Nothing available at your age yet.</p>
      )}
    </>
  );
}
