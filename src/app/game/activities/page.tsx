'use client';

import { useGameStore } from '@/lib/store';
import { CategoryList } from '@/components/ui/CategoryList';

const CASINO_MIN_AGE = 18;
const INVESTING_MIN_AGE = 18;

export default function ActivitiesListPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const items = [
    { href: '/game/activities/crime', title: 'Crime', subtitle: 'Petty theft to grand larceny' },
    ...(character.age >= CASINO_MIN_AGE
      ? [{ href: '/game/activities/casino', title: 'Casino', subtitle: 'Blackjack' }]
      : []),
    ...(character.age >= INVESTING_MIN_AGE
      ? [{ href: '/game/activities/investing', title: 'Investing', subtitle: 'Stocks & crypto' }]
      : []),
    { href: '/game/activities/health', title: 'Health', subtitle: 'Doctor, gym & more' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <CategoryList items={items} />
    </div>
  );
}
