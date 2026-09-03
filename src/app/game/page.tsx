'use client';

import { useGameStore } from '@/lib/store';
import { getEventById } from '@/lib/data/events';
import { EventLog } from '@/components/game/EventLog';
import { EventCard } from '@/components/game/EventCard';
import { AgeUpButton } from '@/components/game/AgeUpButton';

export default function GamePage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const ageUp = useGameStore((state) => state.ageUp);
  const resolveEvent = useGameStore((state) => state.resolveEvent);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const pendingEvent = character.pendingEventId ? getEventById(character.pendingEventId) : undefined;

  return (
    <>
      <EventLog history={character.history} />
      {pendingEvent && <EventCard event={pendingEvent} onChoose={resolveEvent} />}
      <AgeUpButton onAgeUp={ageUp} disabled={Boolean(pendingEvent)} />
    </>
  );
}
