'use client';

import type { Character } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function DeathScreen({ character }: { character: Character }) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center bg-neutral-50 dark:bg-neutral-900">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">In Memoriam</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        {character.name}, age {character.age}
        <br />
        Cause of death: {character.causeOfDeath ?? 'Unknown'}
      </p>
      <div className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        Final stats — Health {character.health}, Happiness {character.happiness}, Smarts{' '}
        {character.smarts}, Looks {character.looks}, Money ${character.money.toLocaleString()}
      </div>
      <Button onClick={() => router.push('/')}>Start New Life</Button>
    </div>
  );
}
