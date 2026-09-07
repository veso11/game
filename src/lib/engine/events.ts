import type { Character, EventRequirements, HistoryEntry, LifeEvent, RelationshipStatus } from '@/lib/types';
import { pickWeighted, chance } from '@/lib/rng';
import { applyEffects } from '@/lib/engine/stats';
import { applyJobEffect } from '@/lib/engine/career';
import { applyRelationshipEffect } from '@/lib/engine/relationships';
import { applyEducationEffect } from '@/lib/engine/education';
import { applyAssetEffect } from '@/lib/engine/assets';
import { nanoid } from 'nanoid';

export function relationshipStatus(character: Character): RelationshipStatus {
  if (character.relationships.some((p) => p.relation === 'spouse' && p.alive)) return 'married';
  if (character.relationships.some((p) => p.relation === 'partner' && p.alive)) return 'partnered';
  return 'single';
}

export function meetsRequirements(character: Character, requires?: EventRequirements): boolean {
  if (!requires) return true;

  if (requires.minStats) {
    for (const [key, min] of Object.entries(requires.minStats)) {
      if (character[key as keyof typeof requires.minStats] as number < (min as number)) return false;
    }
  }
  if (requires.maxStats) {
    for (const [key, max] of Object.entries(requires.maxStats)) {
      if (character[key as keyof typeof requires.maxStats] as number > (max as number)) return false;
    }
  }
  if (requires.educationLevel && !requires.educationLevel.includes(character.education.level)) {
    return false;
  }
  if (requires.hasJob !== undefined && Boolean(character.job) !== requires.hasJob) {
    return false;
  }
  if (requires.relationshipStatus && !requires.relationshipStatus.includes(relationshipStatus(character))) {
    return false;
  }
  if (requires.minMoney !== undefined && character.money < requires.minMoney) {
    return false;
  }
  if (requires.maxMoney !== undefined && character.money > requires.maxMoney) {
    return false;
  }
  if (requires.hasAssetType && !character.assets.some((a) => a.type === requires.hasAssetType)) {
    return false;
  }
  if (requires.minRelationshipMeter) {
    const { relation, min } = requires.minRelationshipMeter;
    const person = character.relationships.find((p) => p.alive && p.relation === relation);
    if (!person || person.relationshipMeter < min) return false;
  }
  return true;
}

export function eligibleEvents(
  character: Character,
  pool: LifeEvent[],
  excludeIds: Set<string>
): LifeEvent[] {
  const fired = new Set(character.firedEventIds ?? []);
  return pool.filter(
    (e) =>
      character.age >= e.minAge &&
      character.age <= e.maxAge &&
      !(e.once && fired.has(e.id)) &&
      !excludeIds.has(e.id) &&
      meetsRequirements(character, e.requires)
  );
}

export function pickEvent(
  character: Character,
  pool: LifeEvent[],
  excludeIds: Set<string>
): LifeEvent | null {
  const eligible = eligibleEvents(character, pool, excludeIds);
  return pickWeighted(eligible, (e) => e.weight);
}

/**
 * Rolls 1-3 events for a single age-up: always one, ~40% chance of a
 * second, and if a second happened, ~10% chance of a third.
 */
export function pickEventsForYear(character: Character, pool: LifeEvent[]): LifeEvent[] {
  const picked: LifeEvent[] = [];
  const excludeIds = new Set<string>();

  const first = pickEvent(character, pool, excludeIds);
  if (!first) return picked;
  picked.push(first);
  excludeIds.add(first.id);

  if (chance(0.4)) {
    const second = pickEvent(character, pool, excludeIds);
    if (second) {
      picked.push(second);
      excludeIds.add(second.id);

      if (chance(0.1)) {
        const third = pickEvent(character, pool, excludeIds);
        if (third) picked.push(third);
      }
    }
  }

  return picked;
}

export function resolveEvent(
  character: Character,
  event: LifeEvent,
  choiceIndex: number
): Character {
  const choice = event.choices[choiceIndex];
  if (!choice) return character;

  let next = applyEffects(character, choice.effects);
  if (choice.jobEffect) next = applyJobEffect(next, choice.jobEffect);
  if (choice.relationshipEffect) next = applyRelationshipEffect(next, choice.relationshipEffect);
  if (choice.educationEffect) next = applyEducationEffect(next, choice.educationEffect);
  if (choice.assetEffect) next = applyAssetEffect(next, choice.assetEffect);

  const entry: HistoryEntry = {
    id: nanoid(),
    age: character.age,
    text: `${event.text} → ${choice.resultText}`,
  };
  next = { ...next, history: [...next.history, entry] };

  if (event.once && !(next.firedEventIds ?? []).includes(event.id)) {
    next.firedEventIds = [...(next.firedEventIds ?? []), event.id];
  }

  const queue = next.eventQueue ?? [];
  next.pendingEventId = queue[0] ?? null;
  next.eventQueue = queue.slice(1);

  return next;
}
