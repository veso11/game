import { describe, it, expect, afterEach } from 'vitest';
import {
  listAvailableJobs,
  hireChance,
  applyForJob,
  quitJob,
  requestRaise,
  applyJobEffect,
  applyCareerYearlyTick,
} from './career';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import type { Job, JobListing } from '@/lib/types';

function job(overrides: Partial<Job> = {}): Job {
  return { id: 'j1', title: 'Test Job', salaryPerYear: 1000, level: 1, yearsInJob: 0, performance: 50, ...overrides };
}

afterEach(() => {
  resetRngSource();
});

describe('listAvailableJobs', () => {
  it('filters out jobs above the character age/smarts/education tier', () => {
    const char = baseCharacter({ age: 16, smarts: 10, education: { level: 'none', enrolled: false, dropoutFlag: false } });
    const jobs = listAvailableJobs(char);
    expect(jobs.every((j) => j.minEducationLevel === 'none')).toBe(true);
    expect(jobs.some((j) => j.id === 'fast_food_worker')).toBe(true);
    expect(jobs.some((j) => j.id === 'software_engineer')).toBe(false);
  });

  it('includes higher-tier jobs once education/smarts/age qualify', () => {
    const char = baseCharacter({
      age: 25,
      smarts: 70,
      education: { level: 'university', enrolled: false, dropoutFlag: false },
    });
    const jobs = listAvailableJobs(char);
    expect(jobs.some((j) => j.id === 'software_engineer')).toBe(true);
  });
});

describe('hireChance', () => {
  it('computes base plus smarts/looks adjustments', () => {
    const listing: JobListing = {
      id: 'x',
      title: 'X',
      minEducationLevel: 'none',
      minSmarts: 20,
      minAge: 0,
      baseSalaryPerYear: 0,
      maxLevel: 5,
    };
    const char = baseCharacter({ smarts: 40, looks: 50 });
    // base 0.5 + (40-20)*0.004 + 50*0.001 = 0.5 + 0.08 + 0.05 = 0.63
    expect(hireChance(char, listing)).toBeCloseTo(0.63);
  });

  it('clamps to a 0.1 floor for very unfavorable candidates', () => {
    const listing: JobListing = {
      id: 'x',
      title: 'X',
      minEducationLevel: 'none',
      minSmarts: 1000,
      minAge: 0,
      baseSalaryPerYear: 0,
      maxLevel: 5,
    };
    const char = baseCharacter({ smarts: 0, looks: 0 });
    expect(hireChance(char, listing)).toBe(0.1);
  });

  it('clamps to a 0.95 ceiling for very favorable candidates', () => {
    const listing: JobListing = {
      id: 'x',
      title: 'X',
      minEducationLevel: 'none',
      minSmarts: -1000,
      minAge: 0,
      baseSalaryPerYear: 0,
      maxLevel: 5,
    };
    const char = baseCharacter({ smarts: 100, looks: 100 });
    expect(hireChance(char, listing)).toBe(0.95);
  });
});

describe('applyForJob', () => {
  it('grants a job and logs history on a successful roll', () => {
    setRngSource(() => 0); // always below any chance threshold => success
    const char = baseCharacter();
    const { character: next, success } = applyForJob(char, 'fast_food_worker');
    expect(success).toBe(true);
    expect(next.job?.title).toBe('Fast Food Worker');
    expect(next.history.at(-1)?.text).toContain('got the job');
  });

  it('leaves job null and logs history on a failed roll', () => {
    setRngSource(() => 0.999); // always above any chance threshold => failure
    const char = baseCharacter();
    const { character: next, success } = applyForJob(char, 'fast_food_worker');
    expect(success).toBe(false);
    expect(next.job).toBeNull();
    expect(next.history.at(-1)?.text).toContain("didn't get");
  });

  it('returns the character unchanged for an unknown listing id', () => {
    const char = baseCharacter();
    const { character: next, success } = applyForJob(char, 'nonexistent');
    expect(success).toBe(false);
    expect(next).toBe(char);
  });
});

describe('quitJob', () => {
  it('clears the job and bumps happiness', () => {
    const char = baseCharacter({ job: job(), happiness: 50 });
    const next = quitJob(char);
    expect(next.job).toBeNull();
    expect(next.happiness).toBe(52);
  });

  it('is a no-op when there is no job', () => {
    const char = baseCharacter({ job: null });
    expect(quitJob(char)).toBe(char);
  });
});

describe('requestRaise', () => {
  it('increases salary by 10% on success', () => {
    setRngSource(() => 0);
    const char = baseCharacter({ job: job({ salaryPerYear: 1000, performance: 80 }) });
    const next = requestRaise(char);
    expect(next.job?.salaryPerYear).toBe(1100);
  });

  it('drops happiness on failure', () => {
    setRngSource(() => 0.999);
    const char = baseCharacter({ job: job({ salaryPerYear: 1000, performance: 10 }), happiness: 50 });
    const next = requestRaise(char);
    expect(next.job?.salaryPerYear).toBe(1000);
    expect(next.happiness).toBe(48);
  });

  it('is a no-op when there is no job', () => {
    const char = baseCharacter({ job: null });
    expect(requestRaise(char)).toBe(char);
  });
});

describe('applyJobEffect', () => {
  it('grantJob sets a job from the catalog', () => {
    const char = baseCharacter({ job: null });
    const next = applyJobEffect(char, { type: 'grantJob', listingId: 'fast_food_worker' });
    expect(next.job?.title).toBe('Fast Food Worker');
  });

  it('grantJob is a no-op if already employed', () => {
    const char = baseCharacter({ job: job() });
    const next = applyJobEffect(char, { type: 'grantJob', listingId: 'fast_food_worker' });
    expect(next.job?.title).toBe('Test Job');
  });

  it('promote increases level and salary', () => {
    const char = baseCharacter({ job: job({ level: 1, salaryPerYear: 1000 }) });
    const next = applyJobEffect(char, { type: 'promote' });
    expect(next.job?.level).toBe(2);
    expect(next.job?.salaryPerYear).toBe(1150);
  });

  it('quit and fire both clear the job', () => {
    expect(applyJobEffect(baseCharacter({ job: job() }), { type: 'quit' }).job).toBeNull();
    expect(applyJobEffect(baseCharacter({ job: job() }), { type: 'fire' }).job).toBeNull();
  });

  it('performanceDelta clamps within 0-100', () => {
    const char = baseCharacter({ job: job({ performance: 95 }) });
    const next = applyJobEffect(char, { type: 'performanceDelta', delta: 20 });
    expect(next.job?.performance).toBe(100);
  });
});

describe('applyCareerYearlyTick', () => {
  it('is a no-op when unemployed', () => {
    const char = baseCharacter({ job: null });
    expect(applyCareerYearlyTick(char)).toBe(char);
  });

  it('pays salary and increments yearsInJob without logging routine history', () => {
    setRngSource(() => 0.5); // mid-range: no drift, no promotion/firing roll
    const char = baseCharacter({ job: job({ salaryPerYear: 1000, performance: 50 }), money: 100, history: [] });
    const next = applyCareerYearlyTick(char);
    expect(next.money).toBe(1100);
    expect(next.job?.yearsInJob).toBe(1);
    expect(next.history).toHaveLength(0);
  });

  it('promotes and logs history on a high-performance favorable roll', () => {
    setRngSource(() => 0); // drift -5, chance(0.15) true
    const char = baseCharacter({ job: job({ level: 1, performance: 90 }), history: [] });
    const next = applyCareerYearlyTick(char);
    expect(next.job?.level).toBe(2);
    expect(next.history.at(-1)?.text).toContain('promoted');
  });

  it('fires and logs history on a low-performance unfavorable roll', () => {
    setRngSource(() => 0); // drift -5, chance(0.1) true
    const char = baseCharacter({ job: job({ performance: 25 }), happiness: 50, history: [] });
    const next = applyCareerYearlyTick(char);
    expect(next.job).toBeNull();
    expect(next.happiness).toBe(40);
    expect(next.history.at(-1)?.text).toContain('let go');
  });
});
