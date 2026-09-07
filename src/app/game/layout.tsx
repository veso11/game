'use client';

import { useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { StatPanel } from '@/components/game/StatPanel';
import { BottomNav } from '@/components/game/BottomNav';
import { DeathScreen } from '@/components/game/DeathScreen';
import { getStageAccent } from '@/lib/lifeStage';

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
    <div
      className="flex min-h-0 flex-1 flex-col bg-bg"
      style={{ '--accent': getStageAccent(character.age) } as CSSProperties}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-baseline gap-2">
          {pathname !== '/game' && (
            <Link
              href="/game"
              aria-label="Back to your year"
              className="text-sm font-semibold text-accent hover:opacity-80"
            >
              ← Year
            </Link>
          )}
          <h1 className="text-lg font-bold text-ink">{character.name}</h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-ink-muted">
            Age {character.age} · {character.country}
          </span>
          <span className="text-sm font-semibold text-gold tabular-nums">
            ${character.money.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      <StatPanel character={character} />

      <BottomNav />
    </div>
  );
}
