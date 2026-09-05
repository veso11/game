import type { CrimeDefinition } from '@/lib/types';

/**
 * 5 crimes spanning the risk/reward curve, from a 12-year-old's first
 * pickpocketing attempt up to an 18+ bank heist. `successStatWeights` are
 * applied against the character's stat *distance from 50* (see
 * `crimeSuccessChance` in `engine/crime.ts`), same shape as career.ts's
 * `hireChance` primary/secondary bonus terms. Smarts dominates the
 * technical crimes; looks matters for the socially-driven ones
 * (shoplifting's "look like you belong", a heist's inside-person charm).
 */
export const CRIME_CATALOG: CrimeDefinition[] = [
  {
    id: 'pickpocketing',
    label: 'Pickpocketing',
    severity: 'petty',
    minAge: 12,
    baseSuccessChance: 0.65,
    successStatWeights: { smarts: 0.003, looks: 0.002 },
    rewardMin: 20,
    rewardMax: 150,
    sentenceYearsMin: 1,
    sentenceYearsMax: 1,
    arrestChanceOnFailure: 0.4,
  },
  {
    id: 'shoplifting',
    label: 'Shoplifting',
    severity: 'petty',
    minAge: 12,
    baseSuccessChance: 0.6,
    successStatWeights: { smarts: 0.002, looks: 0.004 },
    rewardMin: 30,
    rewardMax: 200,
    sentenceYearsMin: 1,
    sentenceYearsMax: 1,
    arrestChanceOnFailure: 0.5,
  },
  {
    id: 'burglary',
    label: 'Burglary',
    severity: 'moderate',
    minAge: 16,
    baseSuccessChance: 0.45,
    successStatWeights: { smarts: 0.005 },
    rewardMin: 500,
    rewardMax: 4000,
    sentenceYearsMin: 2,
    sentenceYearsMax: 4,
    arrestChanceOnFailure: 0.6,
  },
  {
    id: 'grand_theft_auto',
    label: 'Grand Theft Auto',
    severity: 'serious',
    minAge: 16,
    baseSuccessChance: 0.35,
    successStatWeights: { smarts: 0.004, looks: 0.001 },
    rewardMin: 3000,
    rewardMax: 15000,
    sentenceYearsMin: 3,
    sentenceYearsMax: 6,
    arrestChanceOnFailure: 0.65,
  },
  {
    id: 'bank_heist',
    label: 'Bank Heist',
    severity: 'major',
    minAge: 18,
    baseSuccessChance: 0.2,
    successStatWeights: { smarts: 0.006, looks: 0.002 },
    rewardMin: 50000,
    rewardMax: 500000,
    sentenceYearsMin: 8,
    sentenceYearsMax: 15,
    arrestChanceOnFailure: 0.75,
  },
];

export function getCrimeById(id: string): CrimeDefinition | undefined {
  return CRIME_CATALOG.find((crime) => crime.id === id);
}
