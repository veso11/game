'use client';

import { useGameStore } from '@/lib/store';
import { CategoryList } from '@/components/ui/CategoryList';

export default function CareerListPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <CategoryList
        items={[
          {
            href: '/game/career/job',
            title: 'Career',
            subtitle: character.job ? character.job.title : 'Unemployed',
          },
          {
            href: '/game/career/education',
            title: 'Education',
            subtitle: character.education.level === 'none' ? 'Not enrolled' : character.education.level,
          },
        ]}
      />
    </div>
  );
}
