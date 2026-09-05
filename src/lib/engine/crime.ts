import { nanoid } from 'nanoid';
import type { Character, CrimeDefinition, HistoryEntry } from '@/lib/types';
import { CRIME_CATALOG, getCrimeById } from '@/lib/data/crimes';
import { chance, randInt } from '@/lib/rng';

const MAX_CONVICTIONS_SENTENCE_BONUS = 5;

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

export function listAvailableCrimes(character: Character): CrimeDefinition[] {
  return CRIME_CATALOG.filter((crime) => character.age >= crime.minAge);
}

/**
 * Base success chance nudged by weighted smarts/looks bonuses (each stat's
 * distance from the 50 baseline times its weight), same shape as career.ts's
 * `hireChance`. Clamped so no crime is ever a sure thing or hopeless.
 */
export function crimeSuccessChance(character: Character, crime: CrimeDefinition): number {
  const bonus = Object.entries(crime.successStatWeights).reduce((sum, [stat, weight]) => {
    if (weight === undefined) return sum;
    const value = stat === 'smarts' ? character.smarts : character.looks;
    return sum + (value - 50) * weight;
  }, 0);
  return clamp(0.05, 0.95, crime.baseSuccessChance + bonus);
}

export function commitCrime(character: Character, crimeId: string): Character {
  if (character.criminalRecord.inJail) return character;

  const crime = getCrimeById(crimeId);
  if (!crime) return character;
  if (character.age < crime.minAge) return character;

  const succeeded = chance(crimeSuccessChance(character, crime));
  if (succeeded) {
    const reward = randInt(crime.rewardMin, crime.rewardMax);
    const next: Character = { ...character, money: character.money + reward };
    return withHistory(next, `You pulled off ${crime.label} and got away with $${reward.toLocaleString()}.`);
  }

  const caught = chance(crime.arrestChanceOnFailure);
  if (!caught) {
    return withHistory(character, `You botched the ${crime.label} attempt but got away clean.`);
  }

  const sentenceYears =
    randInt(crime.sentenceYearsMin, crime.sentenceYearsMax) +
    Math.min(character.criminalRecord.convictions, MAX_CONVICTIONS_SENTENCE_BONUS);
  const next: Character = {
    ...character,
    job: null,
    criminalRecord: {
      inJail: true,
      yearsLeft: sentenceYears,
      convictions: character.criminalRecord.convictions + 1,
    },
  };
  return withHistory(next, `You were caught committing ${crime.label} and sentenced to ${sentenceYears} year(s) in prison.`);
}

/**
 * Ticks down a prison sentence by one year. No-op when not jailed. Releases
 * and logs at 0 years left; routine countdown years are silent, matching the
 * other yearly ticks (career, education, assets).
 */
export function applyCrimeYearlyTick(character: Character): Character {
  if (!character.criminalRecord.inJail) return character;

  const yearsLeft = character.criminalRecord.yearsLeft - 1;
  if (yearsLeft <= 0) {
    const next: Character = {
      ...character,
      criminalRecord: { ...character.criminalRecord, inJail: false, yearsLeft: 0 },
    };
    return withHistory(next, 'You were released from prison.');
  }

  return { ...character, criminalRecord: { ...character.criminalRecord, yearsLeft } };
}
