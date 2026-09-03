import { nanoid } from 'nanoid';
import type { Character, EducationState, HistoryEntry, Job, JobEffect, JobListing } from '@/lib/types';
import { JOB_CATALOG, getJobListingById } from '@/lib/data/jobs';
import { chance, randInt } from '@/lib/rng';

const EDUCATION_LEVEL_ORDER: EducationState['level'][] = [
  'none',
  'primary',
  'highschool',
  'university',
  'gradschool',
];

function meetsEducationLevel(character: Character, min: EducationState['level']): boolean {
  return EDUCATION_LEVEL_ORDER.indexOf(character.education.level) >= EDUCATION_LEVEL_ORDER.indexOf(min);
}

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

export function listAvailableJobs(character: Character): JobListing[] {
  return JOB_CATALOG.filter(
    (listing) =>
      character.age >= listing.minAge &&
      character.smarts >= listing.minSmarts &&
      meetsEducationLevel(character, listing.minEducationLevel)
  );
}

/**
 * Tunable hire-chance formula: a base rate nudged by smarts/looks, clamped
 * to keep applications never a sure thing nor hopeless.
 */
export function hireChance(character: Character, listing: JobListing): number {
  const base = 0.5;
  const smartsBonus = (character.smarts - listing.minSmarts) * 0.004;
  const looksBonus = character.looks * 0.001;
  return Math.max(0.1, Math.min(0.95, base + smartsBonus + looksBonus));
}

export function applyForJob(character: Character, listingId: string): { character: Character; success: boolean } {
  const listing = getJobListingById(listingId);
  if (!listing) return { character, success: false };

  const success = chance(hireChance(character, listing));
  if (!success) {
    return { character: withHistory(character, `You didn't get the ${listing.title} job.`), success: false };
  }

  const job: Job = {
    id: nanoid(),
    title: listing.title,
    salaryPerYear: listing.baseSalaryPerYear,
    level: 1,
    yearsInJob: 0,
    performance: 50,
  };
  const next = withHistory({ ...character, job }, `You got the job: ${listing.title}!`);
  return { character: next, success: true };
}

export function quitJob(character: Character): Character {
  if (!character.job) return character;
  const title = character.job.title;
  const next: Character = { ...character, job: null, happiness: Math.min(100, character.happiness + 2) };
  return withHistory(next, `You quit your job as ${title}.`);
}

const RAISE_SUCCESS_HISTORY = 'Your boss approved a raise.';
const RAISE_FAILURE_HISTORY = 'Your request for a raise was denied.';

export function requestRaise(character: Character): Character {
  if (!character.job) return character;
  const successChance = Math.max(0.05, Math.min(0.9, character.job.performance / 100));
  if (chance(successChance)) {
    const job: Job = { ...character.job, salaryPerYear: Math.round(character.job.salaryPerYear * 1.1) };
    return withHistory({ ...character, job }, RAISE_SUCCESS_HISTORY);
  }
  const next: Character = { ...character, happiness: Math.max(0, character.happiness - 2) };
  return withHistory(next, RAISE_FAILURE_HISTORY);
}

export function applyJobEffect(character: Character, effect: JobEffect): Character {
  switch (effect.type) {
    case 'grantJob': {
      const listing = getJobListingById(effect.listingId);
      if (!listing || character.job) return character;
      const job: Job = {
        id: nanoid(),
        title: listing.title,
        salaryPerYear: listing.baseSalaryPerYear,
        level: 1,
        yearsInJob: 0,
        performance: 50,
      };
      return { ...character, job };
    }
    case 'promote': {
      if (!character.job || character.job.level >= 5) return character;
      const job: Job = {
        ...character.job,
        level: character.job.level + 1,
        salaryPerYear: Math.round(character.job.salaryPerYear * 1.15),
      };
      return { ...character, job };
    }
    case 'quit':
      return { ...character, job: null };
    case 'fire':
      return { ...character, job: null };
    case 'performanceDelta': {
      if (!character.job) return character;
      const performance = Math.max(0, Math.min(100, character.job.performance + effect.delta));
      return { ...character, job: { ...character.job, performance } };
    }
    default:
      return character;
  }
}

/**
 * Yearly income + career progression: pays salary, drifts performance, and
 * occasionally promotes or fires. Routine income/drift is silent (no
 * history entry); only discrete promotion/firing events are logged.
 */
export function applyCareerYearlyTick(character: Character): Character {
  if (!character.job) return character;

  const job = { ...character.job };
  job.yearsInJob += 1;
  job.performance = Math.max(0, Math.min(100, job.performance + randInt(-5, 5)));

  let next: Character = { ...character, job, money: character.money + job.salaryPerYear };

  // Job level is capped at 5 across the catalog (see JOB_CATALOG maxLevel values).
  const MAX_JOB_LEVEL = 5;
  if (job.performance >= 80 && job.level < MAX_JOB_LEVEL && chance(0.15)) {
    const promoted: Job = { ...job, level: job.level + 1, salaryPerYear: Math.round(job.salaryPerYear * 1.15) };
    next = withHistory({ ...next, job: promoted }, `You were promoted to level ${promoted.level} at your job!`);
  } else if (job.performance <= 20 && chance(0.1)) {
    const title = job.title;
    next = withHistory(
      { ...next, job: null, happiness: Math.max(0, next.happiness - 10) },
      `You were let go from your job as ${title}.`
    );
  }

  return next;
}
