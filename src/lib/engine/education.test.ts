import { describe, it, expect, afterEach } from 'vitest';
import { enroll, dropOut, study, applyEducationEffect, applyEducationYearlyTick } from './education';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import type { EducationState } from '@/lib/types';

function education(overrides: Partial<EducationState> = {}): EducationState {
  return { level: 'none', enrolled: false, dropoutFlag: false, ...overrides };
}

afterEach(() => {
  resetRngSource();
});

describe('enroll', () => {
  it('enrolls in university when highschool is finished, smarts and money suffice', () => {
    const char = baseCharacter({
      education: education({ level: 'highschool' }),
      smarts: 60,
      money: 300,
    });
    const next = enroll(char, 'university', 'Engineering');
    expect(next.education).toMatchObject({ level: 'university', enrolled: true, major: 'Engineering' });
    expect(next.money).toBe(100);
  });

  it('rejects university enrollment without a finished highschool tier', () => {
    const char = baseCharacter({ education: education({ level: 'primary' }), smarts: 60, money: 300, history: [] });
    const next = enroll(char, 'university');
    expect(next.education.level).toBe('primary');
    expect(next.history.at(-1)?.text).toContain('highschool');
  });

  it('rejects university enrollment with insufficient smarts', () => {
    const char = baseCharacter({ education: education({ level: 'highschool' }), smarts: 10, money: 300, history: [] });
    const next = enroll(char, 'university');
    expect(next.education.enrolled).toBe(false);
    expect(next.history.at(-1)?.text).toContain('grades');
  });

  it('rejects university enrollment when tuition is unaffordable', () => {
    const char = baseCharacter({ education: education({ level: 'highschool' }), smarts: 60, money: 10, history: [] });
    const next = enroll(char, 'university');
    expect(next.education.enrolled).toBe(false);
    expect(next.history.at(-1)?.text).toContain('afford');
  });

  it('is a no-op when already enrolled', () => {
    const char = baseCharacter({ education: education({ level: 'university', enrolled: true }) });
    expect(enroll(char, 'gradschool')).toBe(char);
  });

  it('enrolls in gradschool once university is finished', () => {
    const char = baseCharacter({ education: education({ level: 'university' }), smarts: 80, money: 500 });
    const next = enroll(char, 'gradschool', 'Law');
    expect(next.education).toMatchObject({ level: 'gradschool', enrolled: true, major: 'Law' });
    expect(next.money).toBe(100);
  });
});

describe('dropOut', () => {
  it('sets dropoutFlag, unenrolls, and lowers happiness', () => {
    const char = baseCharacter({ education: education({ level: 'highschool', enrolled: true }), happiness: 50 });
    const next = dropOut(char);
    expect(next.education.enrolled).toBe(false);
    expect(next.education.dropoutFlag).toBe(true);
    expect(next.happiness).toBe(45);
  });

  it('is a no-op when not enrolled', () => {
    const char = baseCharacter({ education: education() });
    expect(dropOut(char)).toBe(char);
  });
});

describe('study', () => {
  it('improves gpa and smarts on a favorable roll, at a small happiness cost', () => {
    setRngSource(() => 0); // chance(0.7) true => improved
    const char = baseCharacter({
      education: education({ level: 'university', enrolled: true, gpa: 3.0 }),
      smarts: 50,
      happiness: 50,
    });
    const next = study(char);
    expect(next.education.gpa).toBe(3.2);
    expect(next.smarts).toBe(51);
    expect(next.happiness).toBe(49);
  });

  it('can lower gpa on an unfavorable roll', () => {
    setRngSource(() => 0.999); // chance(0.7) false => not improved
    const char = baseCharacter({ education: education({ level: 'university', enrolled: true, gpa: 3.0 }) });
    const next = study(char);
    expect(next.education.gpa).toBe(2.9);
  });

  it('is a no-op when not enrolled', () => {
    const char = baseCharacter({ education: education() });
    expect(study(char)).toBe(char);
  });
});

describe('applyEducationEffect', () => {
  it('enroll sets the education state directly, bypassing cost/eligibility checks', () => {
    const char = baseCharacter({ education: education(), money: 0 });
    const next = applyEducationEffect(char, { type: 'enroll', level: 'university', major: 'Arts' });
    expect(next.education).toMatchObject({ level: 'university', enrolled: true, major: 'Arts' });
    expect(next.money).toBe(0);
  });

  it('dropout unenrolls and sets the flag', () => {
    const char = baseCharacter({ education: education({ level: 'highschool', enrolled: true }) });
    const next = applyEducationEffect(char, { type: 'dropout' });
    expect(next.education.enrolled).toBe(false);
    expect(next.education.dropoutFlag).toBe(true);
  });

  it('gpaDelta adjusts gpa and clamps to 0-4 while enrolled', () => {
    const char = baseCharacter({ education: education({ level: 'university', enrolled: true, gpa: 3.9 }) });
    const next = applyEducationEffect(char, { type: 'gpaDelta', delta: 0.5 });
    expect(next.education.gpa).toBe(4);
  });

  it('gpaDelta is a no-op when not enrolled', () => {
    const char = baseCharacter({ education: education({ gpa: 3.0 }) });
    expect(applyEducationEffect(char, { type: 'gpaDelta', delta: 0.5 })).toBe(char);
  });
});

describe('applyEducationYearlyTick', () => {
  it('auto-enrolls in primary school once old enough', () => {
    const char = baseCharacter({ age: 5, education: education() });
    const next = applyEducationYearlyTick(char);
    expect(next.education).toMatchObject({ level: 'primary', enrolled: true, currentGrade: 1 });
  });

  it('does not auto-enroll before the minimum age', () => {
    const char = baseCharacter({ age: 4, education: education() });
    expect(applyEducationYearlyTick(char)).toBe(char);
  });

  it('never re-enrolls a dropout automatically', () => {
    const char = baseCharacter({ age: 10, education: education({ dropoutFlag: true }) });
    expect(applyEducationYearlyTick(char)).toBe(char);
  });

  it('advances grade and smarts silently while enrolled', () => {
    const char = baseCharacter({
      age: 6,
      education: education({ level: 'primary', enrolled: true, currentGrade: 1 }),
      smarts: 50,
      history: [],
    });
    const next = applyEducationYearlyTick(char);
    expect(next.education.currentGrade).toBe(2);
    expect(next.smarts).toBeGreaterThan(50);
    expect(next.history).toHaveLength(0);
  });

  it('transitions from primary to highschool after the final grade', () => {
    const char = baseCharacter({
      age: 13,
      education: education({ level: 'primary', enrolled: true, currentGrade: 8 }),
      history: [],
    });
    const next = applyEducationYearlyTick(char);
    expect(next.education.level).toBe('highschool');
    expect(next.education.currentGrade).toBe(1);
    expect(next.history.at(-1)?.text).toContain('graduated primary school');
  });

  it('graduates highschool (unenrolls) after the final grade', () => {
    const char = baseCharacter({
      age: 19,
      education: education({ level: 'highschool', enrolled: true, currentGrade: 6 }),
      history: [],
    });
    const next = applyEducationYearlyTick(char);
    expect(next.education.level).toBe('highschool');
    expect(next.education.enrolled).toBe(false);
    expect(next.history.at(-1)?.text).toContain('graduated highschool');
  });

  it('does not progress university/gradschool automatically', () => {
    const char = baseCharacter({ education: education({ level: 'university', enrolled: true, currentGrade: 1 }) });
    expect(applyEducationYearlyTick(char)).toBe(char);
  });
});
