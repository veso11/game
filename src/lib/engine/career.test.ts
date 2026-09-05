import { describe, it, expect, afterEach } from 'vitest';
import {
  listAvailableJobs,
  hireChance,
  applyForJob,
  quitJob,
  requestRaise,
  applyJobEffect,
  applyCareerYearlyTick,
  resolveJobListing,
} from './career';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import { JOB_CATALOG } from '@/lib/data/jobs';
import type { Job, JobListing } from '@/lib/types';

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

function jobListing(overrides: Partial<JobListing> = {}): JobListing {
  return {
    id: 'x',
    title: 'X',
    field: 'general',
    minEducationLevel: 'none',
    minSmarts: 20,
    minAge: 0,
    baseSalaryPerYear: 0,
    maxSalaryPerYear: Infinity,
    maxLevel: 5,
    ...overrides,
  };
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

  it('includes higher-tier jobs once education/smarts/age/major qualify', () => {
    const char = baseCharacter({
      age: 25,
      smarts: 70,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'computer_science' },
    });
    const jobs = listAvailableJobs(char);
    expect(jobs.some((j) => j.id === 'software_engineer')).toBe(true);
  });

  it('major-gates a real catalog listing (lawyer requires the law major)', () => {
    const noMajor = baseCharacter({
      age: 30,
      smarts: 90,
      education: { level: 'gradschool', enrolled: false, dropoutFlag: false },
    });
    expect(listAvailableJobs(noMajor).some((j) => j.id === 'lawyer')).toBe(false);

    const wrongMajor = baseCharacter({
      age: 30,
      smarts: 90,
      education: { level: 'gradschool', enrolled: false, dropoutFlag: false, major: 'medicine' },
    });
    expect(listAvailableJobs(wrongMajor).some((j) => j.id === 'lawyer')).toBe(false);

    const lawMajor = baseCharacter({
      age: 30,
      smarts: 90,
      education: { level: 'gradschool', enrolled: false, dropoutFlag: false, major: 'law' },
    });
    expect(listAvailableJobs(lawMajor).some((j) => j.id === 'lawyer')).toBe(true);
  });

  it('applies minTalent/minHealth/requiredMajors filtering for a listing carrying them', () => {
    const talentListing = jobListing({
      id: 'test_talent_job',
      title: 'Test Talent Job',
      minTalent: 60,
      minHealth: 70,
      minAge: 18,
      requiredMajors: ['music'],
    });
    JOB_CATALOG.push(talentListing);
    try {
      const lowTalent = baseCharacter({
        age: 20,
        talent: 40,
        health: 90,
        education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'music' },
      });
      expect(listAvailableJobs(lowTalent).some((j) => j.id === 'test_talent_job')).toBe(false);

      const lowHealth = baseCharacter({
        age: 20,
        talent: 80,
        health: 50,
        education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'music' },
      });
      expect(listAvailableJobs(lowHealth).some((j) => j.id === 'test_talent_job')).toBe(false);

      const wrongMajor = baseCharacter({
        age: 20,
        talent: 80,
        health: 90,
        education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'law' },
      });
      expect(listAvailableJobs(wrongMajor).some((j) => j.id === 'test_talent_job')).toBe(false);

      const qualifies = baseCharacter({
        age: 20,
        talent: 80,
        health: 90,
        education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'music' },
      });
      expect(listAvailableJobs(qualifies).some((j) => j.id === 'test_talent_job')).toBe(true);
    } finally {
      JOB_CATALOG.pop();
    }
  });

  it('supports OR-list semantics for multi-major requirements (e.g. financial_analyst with finance OR business)', () => {
    const charWithFinance = baseCharacter({
      age: 25,
      smarts: 60,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'finance' },
    });
    expect(listAvailableJobs(charWithFinance).some((j) => j.id === 'financial_analyst')).toBe(true);

    const charWithBusiness = baseCharacter({
      age: 25,
      smarts: 60,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'business' },
    });
    expect(listAvailableJobs(charWithBusiness).some((j) => j.id === 'financial_analyst')).toBe(true);

    const charWithWrongMajor = baseCharacter({
      age: 25,
      smarts: 60,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'law' },
    });
    expect(listAvailableJobs(charWithWrongMajor).some((j) => j.id === 'financial_analyst')).toBe(false);
  });

  it('major-gates detective (criminal_justice required) while police_officer is open to any major', () => {
    // police_officer is deliberately open (no requiredMajors)
    const noMajor = baseCharacter({
      age: 25,
      smarts: 40,
      education: { level: 'highschool', enrolled: false, dropoutFlag: false },
    });
    expect(listAvailableJobs(noMajor).some((j) => j.id === 'police_officer')).toBe(true);
    expect(listAvailableJobs(noMajor).some((j) => j.id === 'detective')).toBe(false);

    // detective requires criminal_justice
    const withCriminalJustice = baseCharacter({
      age: 30,
      smarts: 60,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'criminal_justice' },
    });
    expect(listAvailableJobs(withCriminalJustice).some((j) => j.id === 'detective')).toBe(true);

    // detective excludes other majors
    const withWrongMajor = baseCharacter({
      age: 30,
      smarts: 60,
      education: { level: 'university', enrolled: false, dropoutFlag: false, major: 'psychology' },
    });
    expect(listAvailableJobs(withWrongMajor).some((j) => j.id === 'detective')).toBe(false);
  });
});

describe('hireChance', () => {
  it('computes base plus smarts/looks adjustments', () => {
    const listing = jobListing({ minSmarts: 20 });
    const char = baseCharacter({ smarts: 40, looks: 50 });
    // base 0.5 + (40-20)*0.004 + 50*0.001 = 0.5 + 0.08 + 0.05 = 0.63
    expect(hireChance(char, listing)).toBeCloseTo(0.63);
  });

  it('clamps to a 0.1 floor for very unfavorable candidates', () => {
    const listing = jobListing({ minSmarts: 1000 });
    const char = baseCharacter({ smarts: 0, looks: 0 });
    expect(hireChance(char, listing)).toBe(0.1);
  });

  it('clamps to a 0.95 ceiling for very favorable candidates', () => {
    const listing = jobListing({ minSmarts: -1000 });
    const char = baseCharacter({ smarts: 100, looks: 100 });
    expect(hireChance(char, listing)).toBe(0.95);
  });

  it('uses talent as the primary stat when primaryStat is "talent"', () => {
    const listing = jobListing({ primaryStat: 'talent', minTalent: 20, minSmarts: 999 });
    const char = baseCharacter({ talent: 40, looks: 50, smarts: 0 });
    // base 0.5 + (40-20)*0.004 + 50*0.001 = 0.63 (smarts/minSmarts ignored entirely)
    expect(hireChance(char, listing)).toBeCloseTo(0.63);
  });

  it('defaults talent to 50 when character.talent is undefined (old-save backward compat)', () => {
    const listing = jobListing({ primaryStat: 'talent', minTalent: 20, minSmarts: 999 });
    const char = baseCharacter({ looks: 0, talent: undefined });
    // base 0.5 + (50-20)*0.004 + 0*0.001 = 0.62
    expect(hireChance(char, listing)).toBeCloseTo(0.62);
  });

  it('uses health as the secondary stat when secondaryStat is "health"', () => {
    const listing = jobListing({ secondaryStat: 'health', minSmarts: 20 });
    const char = baseCharacter({ smarts: 40, looks: 999, health: 50 });
    // base 0.5 + (40-20)*0.004 + 50*0.001 = 0.63 (looks ignored entirely)
    expect(hireChance(char, listing)).toBeCloseTo(0.63);
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

  it('sets job.listingId to the applied listing id', () => {
    setRngSource(() => 0);
    const char = baseCharacter();
    const { character: next } = applyForJob(char, 'fast_food_worker');
    expect(next.job?.listingId).toBe('fast_food_worker');
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

  it('no-ops at the salary cap without rolling RNG', () => {
    let rngCalls = 0;
    setRngSource(() => {
      rngCalls += 1;
      return 0;
    });
    const char = baseCharacter({
      job: job({ listingId: 'fast_food_worker', salaryPerYear: 18000, performance: 90 }),
    });
    const next = requestRaise(char);
    expect(next.job?.salaryPerYear).toBe(18000);
    expect(next.history.at(-1)?.text).toContain('top of your pay scale');
    expect(rngCalls).toBe(0);
  });

  it('clamps a raise to the listing salary cap instead of exceeding it', () => {
    setRngSource(() => 0);
    const char = baseCharacter({
      job: job({ listingId: 'fast_food_worker', salaryPerYear: 17000, performance: 90 }),
    });
    const next = requestRaise(char);
    // 17000 * 1.1 = 18700, clamped to fast_food_worker's maxSalaryPerYear of 18000
    expect(next.job?.salaryPerYear).toBe(18000);
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

  it('does not promote past a listing maxLevel below the old hardcoded cap of 5 (regression)', () => {
    // fast_food_worker's catalog maxLevel is 3; before this fix, applyJobEffect
    // hardcoded `level >= 5` and would have allowed a level-3 fast food worker to
    // keep getting promoted all the way to 5.
    const char = baseCharacter({
      job: job({ listingId: 'fast_food_worker', title: 'Fast Food Worker', level: 3, salaryPerYear: 15000 }),
    });
    const next = applyJobEffect(char, { type: 'promote' });
    expect(next).toBe(char);
    expect(next.job?.level).toBe(3);
  });

  it('uses the listing promotionMultiplier and levelTitles when promoting', () => {
    const promoListing = jobListing({
      id: 'test_promo_job',
      title: 'Test Promo Job',
      maxLevel: 5,
      promotionMultiplier: 2,
      levelTitles: ['Junior Promo', 'Senior Promo'],
    });
    JOB_CATALOG.push(promoListing);
    try {
      const char = baseCharacter({
        job: job({ listingId: 'test_promo_job', level: 1, salaryPerYear: 1000, title: 'Junior Promo' }),
      });
      const next = applyJobEffect(char, { type: 'promote' });
      expect(next.job?.level).toBe(2);
      expect(next.job?.salaryPerYear).toBe(2000);
      expect(next.job?.title).toBe('Senior Promo');
    } finally {
      JOB_CATALOG.pop();
    }
  });

  it('clamps a promotion salary bump to the listing maxSalaryPerYear', () => {
    const char = baseCharacter({
      job: job({ listingId: 'fast_food_worker', title: 'Fast Food Worker', level: 2, salaryPerYear: 17000 }),
    });
    const next = applyJobEffect(char, { type: 'promote' });
    // 17000 * 1.15 = 19550, clamped to fast_food_worker's maxSalaryPerYear of 18000
    expect(next.job?.salaryPerYear).toBe(18000);
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

  it('does not auto-promote past a listing maxLevel below the old hardcoded cap of 5', () => {
    setRngSource(() => 0); // would drift -5 and roll chance(0.15) true if not blocked by the level gate
    const char = baseCharacter({
      job: job({ listingId: 'fast_food_worker', title: 'Fast Food Worker', level: 3, performance: 90 }),
      history: [],
    });
    const next = applyCareerYearlyTick(char);
    expect(next.job?.level).toBe(3);
    expect(next.history).toHaveLength(0);
  });
});

describe('resolveJobListing', () => {
  it('resolves via job.listingId when present', () => {
    const j = job({ listingId: 'fast_food_worker', title: 'Fast Food Worker' });
    expect(resolveJobListing(j)?.id).toBe('fast_food_worker');
  });

  it('falls back to matching by title for a legacy Job with no listingId', () => {
    // Simulates a pre-Task-3 save, whose stored Job predates the listingId field.
    const legacy = {
      id: 'old1',
      title: 'Fast Food Worker',
      salaryPerYear: 12000,
      level: 1,
      yearsInJob: 0,
      performance: 50,
    } as unknown as Job;
    expect(resolveJobListing(legacy)?.id).toBe('fast_food_worker');
  });

  it('returns undefined when neither listingId nor title match any catalog entry', () => {
    const j = job({ listingId: 'nonexistent', title: 'Nonexistent Job' });
    expect(resolveJobListing(j)).toBeUndefined();
  });

  it('returns undefined for a null/undefined job', () => {
    expect(resolveJobListing(null)).toBeUndefined();
    expect(resolveJobListing(undefined)).toBeUndefined();
  });
});
