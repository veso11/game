import { describe, it, expect } from 'vitest';
import { clampStat, applyEffects } from './stats';
import { baseCharacter } from '@/lib/testUtils';

describe('clampStat', () => {
  it('clamps values above 100 down to 100', () => {
    expect(clampStat(150)).toBe(100);
  });

  it('clamps values below 0 up to 0', () => {
    expect(clampStat(-20)).toBe(0);
  });

  it('leaves in-range values unchanged (rounded)', () => {
    expect(clampStat(42.6)).toBe(43);
  });
});

describe('applyEffects', () => {
  it('never lets a stat leave the 0-100 bounds regardless of delta', () => {
    const character = baseCharacter({ health: 95, happiness: 5 });
    const next = applyEffects(character, { health: 50, happiness: -50 });
    expect(next.health).toBe(100);
    expect(next.happiness).toBe(0);
  });

  it('applies money deltas without clamping', () => {
    const character = baseCharacter({ money: 100 });
    const next = applyEffects(character, { money: -500 });
    expect(next.money).toBe(-400);
  });

  it('leaves stats untouched when no effect is specified for them', () => {
    const character = baseCharacter({ smarts: 60, looks: 40 });
    const next = applyEffects(character, { smarts: 5 });
    expect(next.looks).toBe(40);
  });

  it('clamps talent deltas just like the other four stats', () => {
    const character = baseCharacter({ talent: 95 });
    const next = applyEffects(character, { talent: 50 });
    expect(next.talent).toBe(100);
  });

  it('clamps talent down to 0 when delta is negative enough', () => {
    const character = baseCharacter({ talent: 30 });
    const next = applyEffects(character, { talent: -50 });
    expect(next.talent).toBe(0);
  });
});
