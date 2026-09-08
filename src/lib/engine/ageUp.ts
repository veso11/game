import type { Character, HistoryEntry } from '@/lib/types';
import { applyEffects } from '@/lib/engine/stats';
import { pickEventsForYear } from '@/lib/engine/events';
import { applyCareerYearlyTick } from '@/lib/engine/career';
import { applyRelationshipYearlyTick } from '@/lib/engine/relationships';
import { applyEducationYearlyTick } from '@/lib/engine/education';
import { applyAssetYearlyTick } from '@/lib/engine/assets';
import { applyCrimeYearlyTick } from '@/lib/engine/crime';
import { applyHealthYearlyTick, rollDeath } from '@/lib/engine/health';
import { applyMarketYearlyTick } from '@/lib/market/engine';
import { ALL_EVENTS } from '@/lib/data/events';
import { randInt } from '@/lib/rng';
import { nanoid } from 'nanoid';

function entry(age: number, text: string): HistoryEntry {
  return { id: nanoid(), age, text };
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
  // `talent` drifts unconditionally (unlike `smarts`, it isn't tied to
  // schooling) so entertainment/sports minTalent gates aren't trivially
  // satisfied forever by the fixed starting value.
  const drift = {
    health: randInt(-2, 1),
    happiness: randInt(-2, 2),
    talent: randInt(-1, 2),
  };
  next = applyEffects(next, drift);
  next.history = [...next.history, entry(newAge, `You turned ${newAge}.`)];

  next = applyEducationYearlyTick(next);
  next = applyCareerYearlyTick(next);
  next = applyRelationshipYearlyTick(next);
  next = applyAssetYearlyTick(next);
  next = applyCrimeYearlyTick(next);
  next = applyHealthYearlyTick(next);
  next = applyMarketYearlyTick(next);

  const death = rollDeath(next);
  if (death.died) {
    next.alive = false;
    next.causeOfDeath = death.cause;
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
