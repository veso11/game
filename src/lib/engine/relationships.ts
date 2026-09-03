import { nanoid } from 'nanoid';
import type { Character, HistoryEntry, Person, RelationshipEffect } from '@/lib/types';
import { randomName } from '@/lib/data/names';
import { chance, randInt } from '@/lib/rng';

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

function clampMeter(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function findLiving(character: Character, relation: Person['relation']): Person | undefined {
  return character.relationships.find((p) => p.alive && p.relation === relation);
}

function updatePerson(character: Character, personId: string, updater: (p: Person) => Person): Character {
  return {
    ...character,
    relationships: character.relationships.map((p) => (p.id === personId ? updater(p) : p)),
  };
}

function ageOffsetFor(relation: Person['relation'], characterAge: number): number {
  switch (relation) {
    case 'parent':
      return randInt(20, 35);
    case 'child':
      return -Math.min(characterAge, randInt(0, characterAge));
    case 'sibling':
      return randInt(-5, 5);
    default:
      return randInt(-3, 3);
  }
}

/**
 * Seeds a newborn character's starting family: two parents, plus a sibling
 * about half the time. Used once at character creation.
 */
export function createInitialFamily(): Person[] {
  const family: Person[] = [
    { id: nanoid(), name: randomName(), relation: 'parent', alive: true, age: randInt(20, 35), relationshipMeter: 70 },
    { id: nanoid(), name: randomName(), relation: 'parent', alive: true, age: randInt(20, 35), relationshipMeter: 70 },
  ];
  if (chance(0.5)) {
    family.push({
      id: nanoid(),
      name: randomName(),
      relation: 'sibling',
      alive: true,
      age: Math.max(0, randInt(-5, 5)),
      relationshipMeter: 60,
    });
  }
  return family;
}

export function addPerson(
  character: Character,
  relation: Person['relation'],
  opts?: { name?: string; startingMeter?: number }
): Character {
  if (relation === 'partner' && character.age < 16) return character;

  const person: Person = {
    id: nanoid(),
    name: opts?.name ?? randomName(),
    relation,
    alive: true,
    age: Math.max(0, character.age + ageOffsetFor(relation, character.age)),
    relationshipMeter: opts?.startingMeter ?? 50,
  };
  const next: Character = { ...character, relationships: [...character.relationships, person] };
  return withHistory(next, `You met ${person.name}.`);
}

const INTERACTION_COST: Record<'talk' | 'gift' | 'date', number> = { talk: 0, gift: 20, date: 15 };
const INTERACTION_METER_GAIN: Record<'talk' | 'gift' | 'date', number> = { talk: 5, gift: 10, date: 8 };
const INTERACTION_HAPPINESS_GAIN: Record<'talk' | 'gift' | 'date', number> = { talk: 2, gift: 1, date: 4 };

export function interact(character: Character, personId: string, kind: 'talk' | 'gift' | 'date'): Character {
  const person = character.relationships.find((p) => p.id === personId && p.alive);
  if (!person) return character;
  if (kind === 'date' && person.relation !== 'partner' && person.relation !== 'spouse') return character;

  const next = updatePerson(character, personId, (p) => ({
    ...p,
    relationshipMeter: clampMeter(p.relationshipMeter + INTERACTION_METER_GAIN[kind]),
  }));
  const withMoney: Character = { ...next, money: next.money - INTERACTION_COST[kind] };
  const withHappiness: Character = {
    ...withMoney,
    happiness: Math.min(100, withMoney.happiness + INTERACTION_HAPPINESS_GAIN[kind]),
  };
  const verb = kind === 'talk' ? 'caught up with' : kind === 'gift' ? 'gave a gift to' : 'went on a date with';
  return withHistory(withHappiness, `You ${verb} ${person.name}.`);
}

const PROPOSAL_METER_THRESHOLD = 70;

export function propose(character: Character, personId: string): { character: Character; success: boolean } {
  const person = character.relationships.find((p) => p.id === personId && p.alive && p.relation === 'partner');
  if (!person) return { character, success: false };

  if (person.relationshipMeter < PROPOSAL_METER_THRESHOLD) {
    return { character: withHistory(character, `You proposed to ${person.name}, but they weren't ready.`), success: false };
  }

  const next = updatePerson(character, personId, (p) => ({ ...p, relation: 'spouse' }));
  const withHappiness: Character = { ...next, happiness: Math.min(100, next.happiness + 15) };
  return { character: withHistory(withHappiness, `You married ${person.name}!`), success: true };
}

export function breakUp(character: Character, personId: string): Character {
  const person = character.relationships.find(
    (p) => p.id === personId && p.alive && (p.relation === 'partner' || p.relation === 'spouse')
  );
  if (!person) return character;

  const next = updatePerson(character, personId, (p) => ({ ...p, relation: 'exPartner', relationshipMeter: 20 }));
  const withHappiness: Character = { ...next, happiness: Math.max(0, next.happiness - 8) };
  return withHistory(withHappiness, `You and ${person.name} broke up.`);
}

export function applyRelationshipEffect(character: Character, effect: RelationshipEffect): Character {
  switch (effect.type) {
    case 'addPerson':
      return addPerson(character, effect.relation, { startingMeter: effect.startingMeter });
    case 'modifyMeter': {
      const person = findLiving(character, effect.relation);
      if (!person) return character;
      return updatePerson(character, person.id, (p) => ({
        ...p,
        relationshipMeter: clampMeter(p.relationshipMeter + effect.delta),
      }));
    }
    case 'marry': {
      const person = findLiving(character, effect.relation);
      if (!person) return character;
      return updatePerson(character, person.id, (p) => ({ ...p, relation: 'spouse' }));
    }
    case 'breakup': {
      const person = findLiving(character, effect.relation);
      if (!person) return character;
      return updatePerson(character, person.id, (p) => ({ ...p, relation: 'exPartner' }));
    }
    case 'kill': {
      const person = findLiving(character, effect.relation);
      if (!person) return character;
      const next = updatePerson(character, person.id, (p) => ({ ...p, alive: false }));
      return withHistory(next, `Your ${person.relation} ${person.name} passed away.${effect.cause ? ` (${effect.cause})` : ''}`);
    }
    default:
      return character;
  }
}

/**
 * Ages and drifts every living relationship one year; older parents/spouses
 * face a small death roll. Routine aging/meter drift is silent (no history
 * entry) — only a death is logged.
 */
export function applyRelationshipYearlyTick(character: Character): Character {
  if (character.relationships.length === 0) return character;

  let next = character;
  for (const person of character.relationships) {
    if (!person.alive) continue;

    const newAge = person.age + 1;
    const meterDrift = randInt(-3, 2);
    let updated: Person = { ...person, age: newAge, relationshipMeter: clampMeter(person.relationshipMeter + meterDrift) };

    if (newAge > 70) {
      const deathChance = Math.min(0.5, (newAge - 70) * 0.015);
      if (chance(deathChance)) {
        updated = { ...updated, alive: false };
        next = withHistory(next, `Your ${person.relation} ${person.name} passed away.`);
      }
    }

    next = updatePerson(next, person.id, () => updated);
  }

  return next;
}
