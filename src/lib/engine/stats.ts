import type { Character, StatKey } from '@/lib/types';

export function clampStat(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export type StatEffects = Partial<Record<StatKey | 'money', number>>;

export function applyEffects(character: Character, effects: StatEffects): Character {
  const next: Character = { ...character };
  (['health', 'happiness', 'smarts', 'looks'] as StatKey[]).forEach((key) => {
    if (effects[key] !== undefined) {
      next[key] = clampStat(character[key] + effects[key]!);
    }
  });
  if (effects.money !== undefined) {
    next.money = character.money + effects.money;
  }
  return next;
}
