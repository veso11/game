'use client';

import { useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { StatPanel } from '@/components/game/StatPanel';
import { BottomNav } from '@/components/game/BottomNav';
import { DeathScreen } from '@/components/game/DeathScreen';
import { getStageAccent } from '@/lib/lifeStage';

const SECTION_LABELS: Record<string, string> = {
  career: 'Career',
  relationships: 'Relationships',
  assets: 'Assets',
  activities: 'Activities',
};

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

  const segments = pathname.replace(/^\/game\/?/, '').split('/').filter(Boolean);
  const backHref = segments.length === 1 ? '/game' : segments.length >= 2 ? `/game/${segments[0]}` : null;
  const backLabel = segments.length === 1 ? 'Year' : segments.length >= 2 ? (SECTION_LABELS[segments[0]] ?? segments[0]) : '';
  const showHomeFab = segments.length >= 2;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-bg"
      style={{ '--accent': getStageAccent(character.age) } as CSSProperties}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex min-w-0 items-baseline gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={`Back to ${backLabel}`}
              className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
            >
              ← {backLabel}
            </Link>
          )}
          <h1 className="truncate text-lg font-bold text-ink">{character.name}</h1>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm text-ink-muted">
            Age {character.age} · {character.country}
          </span>
          <span className="text-sm font-semibold text-gold tabular-nums">
            ${character.money.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
        {showHomeFab && (
          <Link
            href="/game"
            aria-label="Back to your year"
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg text-accent-fg shadow-lg hover:opacity-90"
          >
            🏠
          </Link>
        )}
      </div>

      <StatPanel character={character} />

      <BottomNav />
    </div>
  );
}
