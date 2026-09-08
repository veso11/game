import { describe, it, expect, afterEach } from 'vitest';
import {
  addCondition,
  cureCondition,
  applyHealthEffect,
  applyHealthYearlyTick,
  visitDoctor,
  toggleGymMembership,
  goForWalk,
  doGardening,
  readABook,
  rollDeath,
  DOCTOR_VISIT_COST,
} from './health';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';

afterEach(() => {
  resetRngSource();
});

describe('addCondition', () => {
  it('adds a new condition with the current age', () => {
    const char = baseCharacter({ age: 30 });
    const next = addCondition(char, 'smoker');
    expect(next.conditions).toEqual([{ conditionId: 'smoker', diagnosedAge: 30 }]);
  });

  it('does not add a duplicate of an already-active condition', () => {
    const char = baseCharacter({ conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = addCondition(char, 'smoker');
    expect(next.conditions).toHaveLength(1);
  });

  it('is a no-op for an unknown condition id', () => {
    const char = baseCharacter();
    const next = addCondition(char, 'not_a_real_condition');
    expect(next).toBe(char);
  });

  it('forces retirement when the condition is career-ending', () => {
    const char = baseCharacter({
      job: { id: 'j1', listingId: 'l1', title: 'Soccer Player', salaryPerYear: 50000, level: 1, yearsInJob: 1, performance: 60 },
    });
    const next = addCondition(char, 'career_ending_injury');
    expect(next.job).toBeNull();
    expect(next.history.at(-1)?.text).toContain('forced you to retire');
  });

  it('defaults conditions to [] on a save missing the field', () => {
    const char = baseCharacter();
    // @ts-expect-error simulating a pre-Phase-5a save
    delete char.conditions;
    const next = addCondition(char, 'smoker');
    expect(next.conditions).toHaveLength(1);
  });
});

describe('cureCondition', () => {
  it('removes the matching condition and leaves others intact', () => {
    const char = baseCharacter({
      conditions: [
        { conditionId: 'smoker', diagnosedAge: 20 },
        { conditionId: 'bad_back', diagnosedAge: 22 },
      ],
    });
    const next = cureCondition(char, 'smoker');
    expect(next.conditions).toEqual([{ conditionId: 'bad_back', diagnosedAge: 22 }]);
  });
});

describe('applyHealthEffect', () => {
  it('dispatches addCondition for type addCondition', () => {
    const char = baseCharacter();
    const next = applyHealthEffect(char, { type: 'addCondition', conditionId: 'smoker' });
    expect(next.conditions.map((c) => c.conditionId)).toContain('smoker');
  });

  it('dispatches cureCondition for type cureCondition', () => {
    const char = baseCharacter({ conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = applyHealthEffect(char, { type: 'cureCondition', conditionId: 'smoker' });
    expect(next.conditions).toHaveLength(0);
  });
});

describe('applyHealthYearlyTick', () => {
  it('applies yearly drift for each active condition', () => {
    setRngSource(() => 0.999999); // never worsens
    const char = baseCharacter({ health: 50, conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = applyHealthYearlyTick(char);
    expect(next.health).toBe(48); // smoker: health -2
  });

  it('applies the worsen penalty on top of yearly drift when the roll hits', () => {
    setRngSource(() => 0); // always worsens
    const char = baseCharacter({ health: 50, conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = applyHealthYearlyTick(char);
    expect(next.health).toBe(42); // -2 yearly, -6 worsen
  });

  it('applies gym drift and cost while membership is active', () => {
    setRngSource(() => 0.999999);
    const char = baseCharacter({ health: 50, money: 1000, gymMembership: true, conditions: [] });
    const next = applyHealthYearlyTick(char);
    expect(next.health).toBe(51);
    expect(next.money).toBe(800);
  });

  it('is a no-op when there are no conditions and no gym membership', () => {
    const char = baseCharacter({ health: 50, conditions: [], gymMembership: false });
    const next = applyHealthYearlyTick(char);
    expect(next.health).toBe(50);
  });
});

describe('visitDoctor', () => {
  it('charges the visit cost and applies a small health boost', () => {
    setRngSource(() => 0.999999); // never cures
    const char = baseCharacter({ money: 1000, health: 50, conditions: [] });
    const next = visitDoctor(char);
    expect(next.money).toBe(1000 - DOCTOR_VISIT_COST);
    expect(next.health).toBe(52);
  });

  it('is a no-op when the character cannot afford the visit', () => {
    const char = baseCharacter({ money: DOCTOR_VISIT_COST - 1 });
    const next = visitDoctor(char);
    expect(next).toBe(char);
  });

  it('cures a condition when the roll hits', () => {
    setRngSource(() => 0); // always cures
    const char = baseCharacter({ money: 1000, conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = visitDoctor(char);
    expect(next.conditions).toHaveLength(0);
    expect(next.history.at(-1)?.text).toContain('Cured');
  });

  it('leaves the condition active when the cure roll misses', () => {
    setRngSource(() => 0.999999); // never cures
    const char = baseCharacter({ money: 1000, conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const next = visitDoctor(char);
    expect(next.conditions).toHaveLength(1);
  });
});

describe('toggleGymMembership', () => {
  it('flips the membership flag on and off', () => {
    const char = baseCharacter({ gymMembership: false });
    const joined = toggleGymMembership(char);
    expect(joined.gymMembership).toBe(true);
    const left = toggleGymMembership(joined);
    expect(left.gymMembership).toBe(false);
  });
});

describe('free-time activities', () => {
  it('goForWalk boosts health and happiness', () => {
    const char = baseCharacter({ health: 50, happiness: 50 });
    const next = goForWalk(char);
    expect(next.health).toBe(52);
    expect(next.happiness).toBe(51);
  });

  it('doGardening boosts happiness and health', () => {
    const char = baseCharacter({ health: 50, happiness: 50 });
    const next = doGardening(char);
    expect(next.happiness).toBe(52);
    expect(next.health).toBe(51);
  });

  it('readABook boosts smarts and happiness', () => {
    const char = baseCharacter({ smarts: 50, happiness: 50 });
    const next = readABook(char);
    expect(next.smarts).toBe(51);
    expect(next.happiness).toBe(51);
  });
});

describe('rollDeath', () => {
  it('dies with the active condition as cause when health hits 0', () => {
    const char = baseCharacter({ health: 0, conditions: [{ conditionId: 'smoker', diagnosedAge: 20 }] });
    const result = rollDeath(char);
    expect(result).toEqual({ died: true, cause: 'Smoking Habit' });
  });

  it('dies of poor health when health hits 0 with no active conditions', () => {
    const char = baseCharacter({ health: 0, conditions: [] });
    const result = rollDeath(char);
    expect(result).toEqual({ died: true, cause: 'Poor health' });
  });

  it('never rolls a death for a healthy young character', () => {
    setRngSource(() => 0.999999);
    const char = baseCharacter({ age: 30, health: 80 });
    expect(rollDeath(char)).toEqual({ died: false });
  });

  it('can die of old age past 70 when the roll hits', () => {
    setRngSource(() => 0);
    const char = baseCharacter({ age: 85, health: 80 });
    expect(rollDeath(char)).toEqual({ died: true, cause: 'Old age' });
  });
});
