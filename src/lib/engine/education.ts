import { nanoid } from 'nanoid';
import type { Character, EducationEffect, HistoryEntry } from '@/lib/types';
import { applyEffects } from '@/lib/engine/stats';
import { chance, randInt } from '@/lib/rng';

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

const AUTO_ENROLL_AGE = 5;
const PRIMARY_MAX_GRADE = 8;
const HIGHSCHOOL_MAX_GRADE = 6;

const UNIVERSITY_MIN_SMARTS = 50;
const GRADSCHOOL_MIN_SMARTS = 70;
const UNIVERSITY_TUITION = 200;
const GRADSCHOOL_TUITION = 400;

export function enroll(character: Character, level: 'university' | 'gradschool', major?: string): Character {
  if (character.education.enrolled) return character;

  if (level === 'university') {
    if (character.education.level !== 'highschool' || character.education.dropoutFlag) {
      return withHistory(character, 'You need to finish highschool before enrolling in university.');
    }
    if (character.smarts < UNIVERSITY_MIN_SMARTS) {
      return withHistory(character, "Your grades aren't strong enough for university yet.");
    }
    if (character.money < UNIVERSITY_TUITION) {
      return withHistory(character, "You can't afford university tuition yet.");
    }
    const next: Character = {
      ...character,
      money: character.money - UNIVERSITY_TUITION,
      education: { level: 'university', enrolled: true, dropoutFlag: false, currentGrade: 1, gpa: 2.5, major },
    };
    return withHistory(next, `You enrolled in university${major ? ` to study ${major}` : ''}.`);
  }

  if (character.education.level !== 'university' || character.education.dropoutFlag) {
    return withHistory(character, 'You need a university degree before enrolling in grad school.');
  }
  if (character.smarts < GRADSCHOOL_MIN_SMARTS) {
    return withHistory(character, "Your grades aren't strong enough for grad school yet.");
  }
  if (character.money < GRADSCHOOL_TUITION) {
    return withHistory(character, "You can't afford grad school tuition yet.");
  }
  const next: Character = {
    ...character,
    money: character.money - GRADSCHOOL_TUITION,
    education: {
      level: 'gradschool',
      enrolled: true,
      dropoutFlag: false,
      currentGrade: 1,
      gpa: 2.5,
      major: major ?? character.education.major,
    },
  };
  return withHistory(next, `You enrolled in grad school${major ? ` to study ${major}` : ''}.`);
}

export function dropOut(character: Character): Character {
  if (!character.education.enrolled) return character;
  const next: Character = {
    ...character,
    education: { ...character.education, enrolled: false, dropoutFlag: true },
    happiness: Math.max(0, character.happiness - 5),
  };
  return withHistory(next, 'You dropped out of school.');
}

export function study(character: Character): Character {
  if (!character.education.enrolled) return character;
  const currentGpa = character.education.gpa ?? 2.5;
  const improved = chance(0.7);
  const gpaDelta = improved ? 0.2 : -0.1;
  const gpa = Math.max(0, Math.min(4, Math.round((currentGpa + gpaDelta) * 100) / 100));
  let next: Character = { ...character, education: { ...character.education, gpa } };
  next = applyEffects(next, { smarts: 1, happiness: -1 });
  return withHistory(
    next,
    improved ? 'You hit the books and your grades improved.' : "You studied hard, but it didn't click this time."
  );
}

export function applyEducationEffect(character: Character, effect: EducationEffect): Character {
  switch (effect.type) {
    case 'enroll':
      return {
        ...character,
        education: {
          level: effect.level,
          enrolled: true,
          dropoutFlag: false,
          currentGrade: 1,
          gpa: character.education.gpa ?? 3.0,
          major: effect.major ?? character.education.major,
        },
      };
    case 'dropout':
      return { ...character, education: { ...character.education, enrolled: false, dropoutFlag: true } };
    case 'gpaDelta': {
      if (!character.education.enrolled) return character;
      const currentGpa = character.education.gpa ?? 2.5;
      const gpa = Math.max(0, Math.min(4, currentGpa + effect.delta));
      return { ...character, education: { ...character.education, gpa } };
    }
    default:
      return character;
  }
}

/**
 * Auto-progresses primary/highschool by age with no player action (enrolling,
 * advancing grades, graduating tiers). University/gradschool are strictly
 * opt-in via `enroll` and are never touched here. Routine grade/smarts
 * drift is silent; only tier transitions are logged.
 */
export function applyEducationYearlyTick(character: Character): Character {
  if (character.criminalRecord.inJail) return character;

  const edu = character.education;

  if (edu.level === 'none' && !edu.dropoutFlag && character.age >= AUTO_ENROLL_AGE) {
    return {
      ...character,
      education: { level: 'primary', enrolled: true, dropoutFlag: false, currentGrade: 1, gpa: 3.0 },
    };
  }

  if (!edu.enrolled || (edu.level !== 'primary' && edu.level !== 'highschool')) return character;

  const currentGrade = (edu.currentGrade ?? 0) + 1;
  const maxGrade = edu.level === 'primary' ? PRIMARY_MAX_GRADE : HIGHSCHOOL_MAX_GRADE;

  let next: Character = applyEffects(character, { smarts: randInt(1, 2) });

  if (currentGrade > maxGrade) {
    if (edu.level === 'primary') {
      next = { ...next, education: { ...next.education, level: 'highschool', currentGrade: 1 } };
      next = withHistory(next, 'You graduated primary school and started highschool.');
    } else {
      next = { ...next, education: { ...next.education, enrolled: false } };
      next = withHistory(next, 'You graduated highschool!');
    }
  } else {
    next = { ...next, education: { ...next.education, currentGrade } };
  }

  return next;
}
