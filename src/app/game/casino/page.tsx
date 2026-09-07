'use client';

import { useGameStore } from '@/lib/store';
import { BlackjackTable } from '@/components/blackjack/BlackjackTable';

export default function CasinoPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const applyCasinoResult = useGameStore((state) => state.applyCasinoResult);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <BlackjackTable money={character.money} onSettle={applyCasinoResult} />
    </div>
  );
}
