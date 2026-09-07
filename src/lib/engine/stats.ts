import type { Character, StatKey } from '@/lib/types';

export function clampStat(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export type StatEffects = Partial<Record<StatKey | 'money', number>>;

export function applyEffects(character: Character, effects: StatEffects): Character {
  const next: Character = { ...character };
  (['health', 'happiness', 'smarts', 'looks', 'talent'] as StatKey[]).forEach((key) => {
    if (effects[key] !== undefined) {
      // `?? 50` guards `talent`, which is `undefined` on pre-Phase-4 saves
      // (it's harmless for the other four stats, which are always defined).
      next[key] = clampStat((character[key] ?? 50) + effects[key]!);
    }
  });
  if (effects.money !== undefined) {
    next.money = character.money + effects.money;
  }
  return next;
}
