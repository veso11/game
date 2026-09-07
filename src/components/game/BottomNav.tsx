'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/game/career', label: 'Career' },
  { href: '/game/relationships', label: 'Relationships' },
  { href: '/game/assets', label: 'Assets' },
  { href: '/game/activities', label: 'Activities' },
];

const ACTIVITIES_MIN_AGE = 12;

export function BottomNav() {
  const pathname = usePathname();
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const character = activeId ? saves[activeId]?.character : undefined;

  const navItems = NAV_ITEMS.filter(
    (item) => item.href !== '/game/activities' || (character && character.age >= ACTIVITIES_MIN_AGE)
  );

  return (
    <nav className="flex border-t border-border bg-surface">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 truncate whitespace-nowrap px-0.5 py-2 text-center text-xs font-semibold transition-colors ${
              active ? 'text-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
