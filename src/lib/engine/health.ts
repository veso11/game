import type { Character, HealthEffect, HistoryEntry } from '@/lib/types';
import { getConditionById } from '@/lib/data/conditions';
import { applyEffects } from '@/lib/engine/stats';
import { chance } from '@/lib/rng';
import { nanoid } from 'nanoid';

export const DOCTOR_VISIT_COST = 300;
const GYM_YEARLY_COST = 200;

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

// `?? []` guards `conditions`, which is undefined on pre-Phase-5a saves.
function conditionsOf(character: Character) {
  return character.conditions ?? [];
}

export function addCondition(character: Character, conditionId: string): Character {
  const conditions = conditionsOf(character);
  if (conditions.some((c) => c.conditionId === conditionId)) return character;
  const def = getConditionById(conditionId);
  if (!def) return character;

  let next: Character = {
    ...character,
    conditions: [...conditions, { conditionId, diagnosedAge: character.age }],
  };
  next = withHistory(next, `You were diagnosed with ${def.name}.`);

  if (def.forcesCareerExit && next.job) {
    const jobTitle = next.job.title;
    next = { ...next, job: null };
    next = withHistory(next, `${def.name} forced you to retire from your career as ${jobTitle}.`);
  }

  return next;
}

export function cureCondition(character: Character, conditionId: string): Character {
  return { ...character, conditions: conditionsOf(character).filter((c) => c.conditionId !== conditionId) };
}

export function applyHealthEffect(character: Character, effect: HealthEffect): Character {
  return effect.type === 'addCondition'
    ? addCondition(character, effect.conditionId)
    : cureCondition(character, effect.conditionId);
}

/**
 * Applies every active condition's yearly drift, rolls `worsenChance` for
 * each untreated one, and applies gym drift/cost if the membership is active.
 */
export function applyHealthYearlyTick(character: Character): Character {
  let next = character;
  for (const active of conditionsOf(character)) {
    const def = getConditionById(active.conditionId);
    if (!def) continue;
    next = applyEffects(next, def.yearlyEffects);
    if (chance(def.worsenChance)) {
      next = applyEffects(next, def.worsenPenalty);
    }
  }
  if (next.gymMembership) {
    next = applyEffects(next, { health: 1, money: -GYM_YEARLY_COST });
  }
  return next;
}

export function visitDoctor(character: Character): Character {
  if (character.money < DOCTOR_VISIT_COST) return character;

  let next = applyEffects(character, { money: -DOCTOR_VISIT_COST, health: 2 });
  const cured: string[] = [];
  const remaining = conditionsOf(next).filter((active) => {
    const def = getConditionById(active.conditionId);
    if (!def) return false;
    if (chance(def.cureChance)) {
      cured.push(def.name);
      return false;
    }
    return true;
  });
  next = { ...next, conditions: remaining };

  return withHistory(
    next,
    cured.length > 0 ? `You visited the doctor. Cured: ${cured.join(', ')}.` : 'You visited the doctor. No change this time.'
  );
}

export function toggleGymMembership(character: Character): Character {
  const next = { ...character, gymMembership: !character.gymMembership };
  return withHistory(next, next.gymMembership ? 'You joined a gym.' : 'You cancelled your gym membership.');
}

export function goForWalk(character: Character): Character {
  return withHistory(applyEffects(character, { health: 2, happiness: 1 }), 'You went for a walk.');
}

export function doGardening(character: Character): Character {
  return withHistory(applyEffects(character, { happiness: 2, health: 1 }), 'You spent time gardening.');
}

export function readABook(character: Character): Character {
  return withHistory(applyEffects(character, { smarts: 1, happiness: 1 }), 'You read a book.');
}

/**
 * Random death probability curve: near-zero in youth, rising steeply past 70.
 * Cause of death, when triggered by health hitting 0, is the first active
 * condition's name if any exist, else the generic 'Poor health'.
 */
export function rollDeath(character: Character): { died: boolean; cause?: string } {
  if (character.health <= 0) {
    const cause = conditionsOf(character)
      .map((c) => getConditionById(c.conditionId))
      .find((def) => def !== undefined)?.name;
    return { died: true, cause: cause ?? 'Poor health' };
  }

  let base = 0;
  if (character.age > 70) base = (character.age - 70) * 0.012;
  if (character.age > 90) base += (character.age - 90) * 0.02;
  const healthPenalty = character.health < 30 ? (30 - character.health) * 0.01 : 0;

  return chance(Math.min(0.9, base + healthPenalty)) ? { died: true, cause: 'Old age' } : { died: false };
}
