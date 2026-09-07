'use client';

import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { PersonCard } from '@/components/game/PersonCard';

export default function RelationshipsPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const addFriend = useGameStore((state) => state.addFriend);
  const interactWithPerson = useGameStore((state) => state.interactWithPerson);
  const proposeToPartner = useGameStore((state) => state.proposeToPartner);
  const breakUpWith = useGameStore((state) => state.breakUpWith);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const tooYoungToMeetPeople = character.age < 16;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <Button variant="secondary" className="w-full" onClick={addFriend} disabled={tooYoungToMeetPeople}>
        {tooYoungToMeetPeople ? "You're too young to meet new people" : 'Meet Someone New'}
      </Button>

      {character.relationships.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No relationships yet.</p>
      )}

      {character.relationships.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          onInteract={interactWithPerson}
          onPropose={proposeToPartner}
          onBreakUp={breakUpWith}
        />
      ))}
    </div>
  );
}
