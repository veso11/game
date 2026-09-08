'use client';

import { useGameStore } from '@/lib/store';
import { CrimeSection } from '@/components/game/CrimeSection';

export default function CrimePage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <CrimeSection character={character} />
    </div>
  );
}
