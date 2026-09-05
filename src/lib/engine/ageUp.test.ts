import { describe, it, expect, afterEach } from 'vitest';
import { ageUp } from './ageUp';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import type { AssetItem, Job } from '@/lib/types';

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 'j1',
    listingId: '',
    title: 'Test Job',
    salaryPerYear: 1000,
    level: 1,
    yearsInJob: 0,
    performance: 50,
    ...overrides,
  };
}

function asset(overrides: Partial<AssetItem> = {}): AssetItem {
  return { id: 'a1', catalogId: 'pet_dog', type: 'item', name: 'Dog', value: 20, happinessBonus: 8, ...overrides };
}

afterEach(() => {
  resetRngSource();
});

describe('ageUp', () => {
  it('is a no-op for a dead character', () => {
    const char = baseCharacter({ alive: false });
    expect(ageUp(char)).toBe(char);
  });

  it('increments age and pays salary for an employed, surviving character', () => {
    setRngSource(() => 0.5); // mid-range: survives, no promotion/firing roll
    const char = baseCharacter({ age: 30, health: 90, happiness: 50, job: job({ salaryPerYear: 1000 }), money: 100 });
    const next = ageUp(char);
    expect(next.age).toBe(31);
    expect(next.alive).toBe(true);
    expect(next.money).toBe(1100);
    expect(next.job?.yearsInJob).toBe(1);
  });

  it('leaves money and job untouched for an unemployed character', () => {
    setRngSource(() => 0.5);
    const char = baseCharacter({ age: 30, health: 90, job: null, money: 100 });
    const next = ageUp(char);
    expect(next.money).toBe(100);
    expect(next.job).toBeNull();
  });

  it('pays salary even in the year the character dies (career tick runs before the death roll)', () => {
    setRngSource(() => 0); // guarantees death for an elderly character, deterministic drift
    const char = baseCharacter({ age: 94, health: 90, job: job({ salaryPerYear: 1000 }), money: 100 });
    const next = ageUp(char);
    expect(next.alive).toBe(false);
    expect(next.money).toBe(1100);
  });

  it('runs the full tick chain together: education, career, and asset upkeep in one year', () => {
    setRngSource(() => 0.5); // mid-range: survives, no promotion/firing roll
    const char = baseCharacter({
      age: 10,
      health: 90,
      smarts: 50,
      money: 1000,
      job: job({ salaryPerYear: 1000 }),
      education: { level: 'primary', enrolled: true, dropoutFlag: false, currentGrade: 1 },
      assets: [asset({ catalogId: 'pet_dog' })],
    });
    const next = ageUp(char);
    expect(next.age).toBe(11);
    expect(next.alive).toBe(true);
    // education: smarts +2 (silent); career: +1000 salary; assets: -200 upkeep (pet_dog)
    expect(next.smarts).toBe(52);
    expect(next.education.currentGrade).toBe(2);
    expect(next.job?.yearsInJob).toBe(1);
    expect(next.money).toBe(1800);
    expect(next.assets).toHaveLength(1);
  });

  it('drifts talent by a small unconditional amount each year', () => {
    setRngSource(() => 0.5); // randInt(-1, 2) resolves to 1
    const char = baseCharacter({ age: 30, health: 90, talent: 50, job: null });
    const next = ageUp(char);
    expect(next.talent).toBe(51);
  });

  it('clamps talent drift at the 100 upper bound', () => {
    setRngSource(() => 0.99); // randInt(-1, 2) resolves to 2
    const char = baseCharacter({ age: 30, health: 90, talent: 99, job: null });
    const next = ageUp(char);
    expect(next.talent).toBe(100);
  });

  it('clamps talent drift at the 0 lower bound', () => {
    setRngSource(() => 0); // randInt(-1, 2) resolves to -1
    const char = baseCharacter({ age: 30, health: 90, talent: 0, job: null });
    const next = ageUp(char);
    expect(next.talent).toBe(0);
  });
});
