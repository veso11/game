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

function meetsMajorRequirement(character: Character, listing: JobListing): boolean {
  if (!listing.requiredMajors || listing.requiredMajors.length === 0) return true;
  return listing.requiredMajors.includes(character.education.major ?? '');
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

/**
 * Resolves the JobListing a live Job came from: prefers the linked
 * `listingId`, and falls back to matching JOB_CATALOG by title for
 * pre-Task-3 saves whose Job predates the listingId field. Returns
 * undefined if neither resolves, so call sites fall back to today's
 * hardcoded constants (cap 5, multiplier 1.15, salary cap Infinity).
 */
export function resolveJobListing(job: Job | null | undefined): JobListing | undefined {
  if (!job) return undefined;
  if (job.listingId) {
    const byId = getJobListingById(job.listingId);
    if (byId) return byId;
  }
  return JOB_CATALOG.find((listing) => listing.title === job.title);
}

function buildJob(listing: JobListing): Job {
  return {
    id: nanoid(),
    listingId: listing.id,
    title: listing.levelTitles?.[0] ?? listing.title,
    salaryPerYear: listing.baseSalaryPerYear,
    level: 1,
    yearsInJob: 0,
    performance: 50,
  };
}

export function listAvailableJobs(character: Character): JobListing[] {
  return JOB_CATALOG.filter(
    (listing) =>
      character.age >= listing.minAge &&
      character.smarts >= listing.minSmarts &&
      (listing.minTalent === undefined || (character.talent ?? 50) >= listing.minTalent) &&
      (listing.minHealth === undefined || character.health >= listing.minHealth) &&
      meetsEducationLevel(character, listing.minEducationLevel) &&
      meetsMajorRequirement(character, listing)
  );
}

/**
 * Tunable hire-chance formula: a base rate nudged by a primary stat
 * (smarts or talent) and a secondary stat (looks or health), clamped to
 * keep applications never a sure thing nor hopeless. With no
 * primaryStat/secondaryStat set on the listing, this is byte-identical
 * to the original smarts/looks-only formula.
 */
export function hireChance(character: Character, listing: JobListing): number {
  const primaryStat = listing.primaryStat ?? 'smarts';
  const primaryValue = primaryStat === 'talent' ? (character.talent ?? 50) : character.smarts;
  const primaryFloor = primaryStat === 'talent' ? (listing.minTalent ?? 0) : listing.minSmarts;
  const primaryBonus = (primaryValue - primaryFloor) * 0.004;
  const secondaryStat = listing.secondaryStat ?? 'looks';
  const secondaryValue = secondaryStat === 'health' ? character.health : character.looks;
  return clamp(0.1, 0.95, 0.5 + primaryBonus + secondaryValue * 0.001);
}

export function applyForJob(character: Character, listingId: string): { character: Character; success: boolean } {
  const listing = getJobListingById(listingId);
  if (!listing) return { character, success: false };

  const success = chance(hireChance(character, listing));
  if (!success) {
    return { character: withHistory(character, `You didn't get the ${listing.title} job.`), success: false };
  }

  const job = buildJob(listing);
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
const RAISE_AT_CAP_HISTORY = "You're already at the top of your pay scale.";

export function requestRaise(character: Character): Character {
  if (!character.job) return character;
  const listing = resolveJobListing(character.job);
  const cap = listing?.maxSalaryPerYear ?? Infinity;
  if (character.job.salaryPerYear >= cap) {
    return withHistory(character, RAISE_AT_CAP_HISTORY);
  }
  const successChance = Math.max(0.05, Math.min(0.9, character.job.performance / 100));
  if (chance(successChance)) {
    const salaryPerYear = Math.min(cap, Math.round(character.job.salaryPerYear * 1.1));
    const job: Job = { ...character.job, salaryPerYear };
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
      const job = buildJob(listing);
      return { ...character, job };
    }
    case 'promote': {
      if (!character.job) return character;
      const listing = resolveJobListing(character.job);
      const maxLevel = listing?.maxLevel ?? 5;
      if (character.job.level >= maxLevel) return character;
      const multiplier = listing?.promotionMultiplier ?? 1.15;
      const cap = listing?.maxSalaryPerYear ?? Infinity;
      const level = character.job.level + 1;
      const salaryPerYear = Math.min(cap, Math.round(character.job.salaryPerYear * multiplier));
      const title = listing?.levelTitles?.[level - 1] ?? character.job.title;
      const job: Job = { ...character.job, level, salaryPerYear, title };
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

  const listing = resolveJobListing(character.job);
  const maxLevel = listing?.maxLevel ?? 5;
  const multiplier = listing?.promotionMultiplier ?? 1.15;
  const salaryCap = listing?.maxSalaryPerYear ?? Infinity;

  const job = { ...character.job };
  job.yearsInJob += 1;
  job.performance = Math.max(0, Math.min(100, job.performance + randInt(-5, 5)));

  let next: Character = { ...character, job, money: character.money + job.salaryPerYear };

  if (job.performance >= 80 && job.level < maxLevel && chance(0.15)) {
    const level = job.level + 1;
    const salaryPerYear = Math.min(salaryCap, Math.round(job.salaryPerYear * multiplier));
    const title = listing?.levelTitles?.[level - 1] ?? job.title;
    const promoted: Job = { ...job, level, salaryPerYear, title };
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
