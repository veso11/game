'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { StatPanel } from '@/components/game/StatPanel';
import { BottomNav } from '@/components/game/BottomNav';
import { DeathScreen } from '@/components/game/DeathScreen';

export default function GameLayout({ children }: LayoutProps<'/game'>) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const hasHydrated = useGameStore((state) => state.hasHydrated);

  const character = activeId ? saves[activeId]?.character : undefined;

  useEffect(() => {
    if (hasHydrated && !character) {
      router.replace('/');
    }
  }, [hasHydrated, character, router]);

  useEffect(() => {
    if (character?.pendingEventId && pathname !== '/game') {
      router.replace('/game');
    }
  }, [character?.pendingEventId, pathname, router]);

  if (!hasHydrated || !character) {
    return null;
  }

  if (!character.alive) {
    return <DeathScreen character={character} />;
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

      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>

      <BottomNav />
    </div>
  );
}
