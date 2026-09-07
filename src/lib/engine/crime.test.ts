import { describe, it, expect, afterEach } from 'vitest';
import { crimeSuccessChance, commitCrime, applyCrimeYearlyTick, listAvailableCrimes } from './crime';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import { getCrimeById } from '@/lib/data/crimes';

// Sequentially returns each value in `values` on successive rng calls,
// repeating the last value once exhausted.
function queueRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)];
    i++;
    return v;
  };
}

afterEach(() => {
  resetRngSource();
});

describe('crimeSuccessChance', () => {
  it('returns the base chance when stats sit at the 50 baseline', () => {
    const char = baseCharacter({ smarts: 50, looks: 50 });
    const pickpocketing = getCrimeById('pickpocketing')!;
    expect(crimeSuccessChance(char, pickpocketing)).toBeCloseTo(pickpocketing.baseSuccessChance, 5);
  });

  it('raises the chance with higher smarts/looks and clamps to 0.95', () => {
    const char = baseCharacter({ smarts: 100, looks: 100 });
    const bankHeist = getCrimeById('bank_heist')!;
    const chance = crimeSuccessChance(char, bankHeist);
    expect(chance).toBeGreaterThan(bankHeist.baseSuccessChance);
    expect(chance).toBeLessThanOrEqual(0.95);
  });

  it('lowers the chance with poor stats and clamps to 0.05', () => {
    const char = baseCharacter({ smarts: 0, looks: 0 });
    const bankHeist = getCrimeById('bank_heist')!;
    expect(crimeSuccessChance(char, bankHeist)).toBeGreaterThanOrEqual(0.05);
  });
});

describe('listAvailableCrimes', () => {
  it('filters crimes by minAge', () => {
    const char = baseCharacter({ age: 14 });
    const crimes = listAvailableCrimes(char);
    expect(crimes.some((c) => c.id === 'pickpocketing')).toBe(true);
    expect(crimes.some((c) => c.id === 'bank_heist')).toBe(false);
  });
});

describe('commitCrime', () => {
  it('rewards money and logs history on a successful attempt', () => {
    setRngSource(() => 0); // chance(any positive p) true; randInt floors to the min
    const char = baseCharacter({ age: 20, money: 100, history: [] });
    const next = commitCrime(char, 'pickpocketing');
    expect(next.money).toBeGreaterThan(100);
    expect(next.history.at(-1)?.text).toContain('pulled off');
  });

  it('jails the character and clears their job when caught', () => {
    // 1st call: success roll fails (>= baseSuccessChance). 2nd call: arrest roll succeeds (< arrestChanceOnFailure).
    setRngSource(queueRng([0.9, 0.1, 0]));
    const char = baseCharacter({
      age: 20,
      money: 100,
      job: { id: 'j1', listingId: '', title: 'Cashier', salaryPerYear: 20000, level: 1, yearsInJob: 0, performance: 50 },
      history: [],
      criminalRecord: { inJail: false, yearsLeft: 0, convictions: 0 },
    });
    const next = commitCrime(char, 'pickpocketing');
    expect(next.criminalRecord.inJail).toBe(true);
    expect(next.criminalRecord.yearsLeft).toBe(1); // pickpocketing sentence is always exactly 1 year
    expect(next.criminalRecord.convictions).toBe(1);
    expect(next.job).toBeNull();
    expect(next.history.at(-1)?.text).toContain('sentenced');
  });

  it('applies a repeat-offender sentence bonus from prior convictions', () => {
    // 1st call: success roll fails. 2nd call: arrest roll succeeds. 3rd call: sentence randInt floors to the min (2).
    setRngSource(queueRng([0.9, 0.1, 0]));
    const char = baseCharacter({
      age: 20,
      history: [],
      criminalRecord: { inJail: false, yearsLeft: 0, convictions: 3 },
    });
    const next = commitCrime(char, 'burglary');
    expect(next.criminalRecord.yearsLeft).toBe(5); // base sentence (2) + min(convictions, 5) = 2 + 3
    expect(next.criminalRecord.convictions).toBe(4);
  });

  it('caps the repeat-offender bonus at 5 extra years', () => {
    setRngSource(queueRng([0.9, 0.1, 0]));
    const char = baseCharacter({
      age: 20,
      history: [],
      criminalRecord: { inJail: false, yearsLeft: 0, convictions: 9 },
    });
    const next = commitCrime(char, 'burglary');
    expect(next.criminalRecord.yearsLeft).toBe(7); // base sentence (2) + min(convictions, 5) = 2 + 5
  });

  it('logs a clean getaway with no state change when the failed attempt is not caught', () => {
    // 1st call: success roll fails. 2nd call: arrest roll also fails.
    setRngSource(queueRng([0.9, 0.9]));
    const char = baseCharacter({ age: 20, money: 100, history: [] });
    const next = commitCrime(char, 'pickpocketing');
    expect(next.money).toBe(100);
    expect(next.criminalRecord.inJail).toBe(false);
    expect(next.job).toBe(char.job);
    expect(next.history.at(-1)?.text).toContain('got away clean');
  });

  it('is a no-op when the character is too young for the crime', () => {
    const char = baseCharacter({ age: 10 });
    expect(commitCrime(char, 'pickpocketing')).toBe(char);
  });

  it('is a no-op when already in jail', () => {
    const char = baseCharacter({
      age: 20,
      criminalRecord: { inJail: true, yearsLeft: 2, convictions: 1 },
    });
    expect(commitCrime(char, 'pickpocketing')).toBe(char);
  });

  it('is a no-op for an unknown crime id', () => {
    const char = baseCharacter({ age: 20 });
    expect(commitCrime(char, 'nonexistent_crime')).toBe(char);
  });
});

describe('applyCrimeYearlyTick', () => {
  it('is a no-op when not in jail', () => {
    const char = baseCharacter({ criminalRecord: { inJail: false, yearsLeft: 0, convictions: 0 } });
    expect(applyCrimeYearlyTick(char)).toBe(char);
  });

  it('decrements yearsLeft while still serving time', () => {
    const char = baseCharacter({
      criminalRecord: { inJail: true, yearsLeft: 3, convictions: 1 },
      history: [],
    });
    const next = applyCrimeYearlyTick(char);
    expect(next.criminalRecord.inJail).toBe(true);
    expect(next.criminalRecord.yearsLeft).toBe(2);
    expect(next.history).toHaveLength(0);
  });

  it('releases and logs history once the sentence reaches 0', () => {
    const char = baseCharacter({
      criminalRecord: { inJail: true, yearsLeft: 1, convictions: 1 },
      history: [],
    });
    const next = applyCrimeYearlyTick(char);
    expect(next.criminalRecord.inJail).toBe(false);
    expect(next.criminalRecord.yearsLeft).toBe(0);
    expect(next.history.at(-1)?.text).toContain('released from prison');
  });
});
