import type { HealthCondition } from '@/lib/types';

/**
 * Conditions are data rows, not branching engine code — matching the
 * catalog-driven pattern already used for jobs/crimes/majors. `worsenPenalty`
 * is a one-time hit applied the year `worsenChance` rolls true; it does not
 * compound or escalate into a different condition (no severity tiers in v1).
 */
export const CONDITION_CATALOG: HealthCondition[] = [
  {
    id: 'smoker',
    name: 'Smoking Habit',
    description: 'A pack-a-day habit that quietly wears down your health.',
    yearlyEffects: { health: -2 },
    cureChance: 0.25,
    worsenChance: 0.12,
    worsenPenalty: { health: -6 },
  },
  {
    id: 'alcoholism',
    name: 'Alcoholism',
    description: "Drinking's stopped being just a social thing.",
    yearlyEffects: { health: -1, happiness: -2 },
    cureChance: 0.2,
    worsenChance: 0.12,
    worsenPenalty: { health: -5, money: -500 },
  },
  {
    id: 'bad_back',
    name: 'Bad Back',
    description: 'An old injury that never quite healed right.',
    yearlyEffects: { health: -1 },
    cureChance: 0.35,
    worsenChance: 0.1,
    worsenPenalty: { health: -3 },
  },
  {
    id: 'career_ending_injury',
    name: 'Career-Ending Injury',
    description: "Your body can't take the physical strain anymore.",
    yearlyEffects: { health: -1, happiness: -3 },
    cureChance: 0.5,
    worsenChance: 0.08,
    worsenPenalty: { health: -4 },
    forcesCareerExit: true,
  },
  {
    id: 'gunshot_wound',
    name: 'Gunshot Wound',
    description: 'A crime gone wrong left lasting damage.',
    yearlyEffects: { health: -3 },
    cureChance: 0.3,
    worsenChance: 0.2,
    worsenPenalty: { health: -10 },
  },
];

export function getConditionById(id: string): HealthCondition | undefined {
  return CONDITION_CATALOG.find((condition) => condition.id === id);
}
