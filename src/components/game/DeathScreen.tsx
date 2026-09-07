'use client';

import type { Character } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function DeathScreen({ character }: { character: Character }) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
      <h1 className="text-2xl font-bold text-ink">In Memoriam</h1>
      <p className="text-ink-muted">
        {character.name}, age {character.age}
        <br />
        Cause of death: {character.causeOfDeath ?? 'Unknown'}
      </p>
      <div className="text-sm text-ink-muted max-w-sm">
        Final stats — Health {character.health}, Happiness {character.happiness}, Smarts{' '}
        {character.smarts}, Looks {character.looks}, Money ${character.money.toLocaleString()}
      </div>
      <Button onClick={() => router.push('/')}>Start New Life</Button>
    </div>
  );
}
