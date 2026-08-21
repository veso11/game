'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { getEventById } from '@/lib/data/events';
import { StatPanel } from '@/components/game/StatPanel';
import { EventLog } from '@/components/game/EventLog';
import { EventCard } from '@/components/game/EventCard';
import { AgeUpButton } from '@/components/game/AgeUpButton';
import { DeathScreen } from '@/components/game/DeathScreen';

export default function GamePage() {
  const router = useRouter();
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const ageUp = useGameStore((state) => state.ageUp);
  const resolveEvent = useGameStore((state) => state.resolveEvent);
  const hasHydrated = useGameStore((state) => state.hasHydrated);

  const character = activeId ? saves[activeId]?.character : undefined;
  const pendingEvent = character?.pendingEventId ? getEventById(character.pendingEventId) : undefined;

  useEffect(() => {
    if (hasHydrated && !character) {
      router.replace('/');
    }
  }, [hasHydrated, character, router]);

  if (!hasHydrated || !character) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-baseline justify-between px-4 py-2 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{character.name}</h1>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Age {character.age} · {character.country}
        </span>
      </div>

      <StatPanel character={character} />

      {character.alive ? (
        <>
          <EventLog history={character.history} />
          {pendingEvent && <EventCard event={pendingEvent} onChoose={resolveEvent} />}
          <AgeUpButton onAgeUp={ageUp} disabled={Boolean(pendingEvent)} />
        </>
      ) : (
        <DeathScreen character={character} />
      )}
    </div>
  );
}
