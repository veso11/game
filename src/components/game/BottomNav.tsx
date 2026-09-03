'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store';

interface NavItem {
  href: string;
  label: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/game', label: 'Home' },
  { href: '/game/career', label: 'Career' },
  { href: '/game/relationships', label: 'Relationships' },
  { href: '/game/education', label: 'Education' },
  { href: '/game/assets', label: 'Assets' },
];

const CASINO_MIN_AGE = 18;

export function BottomNav() {
  const pathname = usePathname();
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const character = activeId ? saves[activeId]?.character : undefined;

  const navItems =
    character && character.age >= CASINO_MIN_AGE
      ? [...BASE_NAV_ITEMS, { href: '/game/casino', label: 'Casino' }]
      : BASE_NAV_ITEMS;

  return (
    <nav className="flex border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${
              active
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
