'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export function SaveSlotList() {
  const router = useRouter();
  const saves = useGameStore((state) => state.saves);
  const loadLife = useGameStore((state) => state.loadLife);
  const deleteLife = useGameStore((state) => state.deleteLife);

  const entries = Object.values(saves).sort((a, b) => b.lastPlayed - a.lastPlayed);

  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No saved lives yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {entries.map(({ character }) => (
        <div
          key={character.id}
          className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
        >
          <div className="text-sm text-neutral-800 dark:text-neutral-100">
            <div className="font-medium">{character.name}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Age {character.age} · {character.alive ? 'Alive' : 'Deceased'}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => {
                loadLife(character.id);
                router.push('/game');
              }}
            >
              {character.alive ? 'Continue' : 'View'}
            </Button>
            <Button
              variant="danger"
              className="px-2 py-1 text-xs"
              onClick={() => deleteLife(character.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
