import type { Character, HistoryEntry } from '@/lib/types';
import { applyEffects } from '@/lib/engine/stats';
import { pickEventsForYear } from '@/lib/engine/events';
import { applyCareerYearlyTick } from '@/lib/engine/career';
import { applyRelationshipYearlyTick } from '@/lib/engine/relationships';
import { applyEducationYearlyTick } from '@/lib/engine/education';
import { applyAssetYearlyTick } from '@/lib/engine/assets';
import { applyCrimeYearlyTick } from '@/lib/engine/crime';
import { ALL_EVENTS } from '@/lib/data/events';
import { randInt, chance } from '@/lib/rng';
import { nanoid } from 'nanoid';

function entry(age: number, text: string): HistoryEntry {
  return { id: nanoid(), age, text };
}

/**
 * Random death probability curve: near-zero in youth, rising steeply past 70.
 */
function rollDeath(age: number, health: number): boolean {
  if (health <= 0) return true;
  let base = 0;
  if (age > 70) base = (age - 70) * 0.012;
  if (age > 90) base += (age - 90) * 0.02;
  const healthPenalty = health < 30 ? (30 - health) * 0.01 : 0;
  return chance(Math.min(0.9, base + healthPenalty));
}

export function ageUp(character: Character): Character {
  if (!character.alive) return character;

  const newAge = character.age + 1;
  let next: Character = {
    ...character,
    age: newAge,
    history: [...character.history],
  };

  // Baseline yearly drift so a life isn't static without event content yet.
  const drift = {
    health: randInt(-2, 1),
    happiness: randInt(-2, 2),
  };
  next = applyEffects(next, drift);
  next.history = [...next.history, entry(newAge, `You turned ${newAge}.`)];

  next = applyEducationYearlyTick(next);
  next = applyCareerYearlyTick(next);
  next = applyRelationshipYearlyTick(next);
  next = applyAssetYearlyTick(next);
  next = applyCrimeYearlyTick(next);

  if (rollDeath(newAge, next.health)) {
    next.alive = false;
    next.causeOfDeath = next.health <= 0 ? 'Poor health' : 'Old age';
    next.history = [...next.history, entry(newAge, `You passed away at age ${newAge}. Cause: ${next.causeOfDeath}.`)];
    return next;
  }

  const events = pickEventsForYear(next, ALL_EVENTS);
  if (events.length > 0) {
    next.pendingEventId = events[0].id;
    next.eventQueue = events.slice(1).map((e) => e.id);
  }

  return next;
}
