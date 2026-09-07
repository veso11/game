import { describe, it, expect, afterEach } from 'vitest';
import {
  createInitialFamily,
  addPerson,
  interact,
  propose,
  breakUp,
  applyRelationshipEffect,
  applyRelationshipYearlyTick,
} from './relationships';
import { baseCharacter } from '@/lib/testUtils';
import { setRngSource, resetRngSource } from '@/lib/rng';
import type { Person } from '@/lib/types';

function person(overrides: Partial<Person> = {}): Person {
  return { id: 'p1', name: 'Sam', relation: 'friend', alive: true, age: 30, relationshipMeter: 50, ...overrides };
}

afterEach(() => {
  resetRngSource();
});

describe('createInitialFamily', () => {
  it('always includes two living parents', () => {
    setRngSource(() => 0.999); // chance(0.5) false => no sibling
    const family = createInitialFamily();
    expect(family.filter((p) => p.relation === 'parent')).toHaveLength(2);
    expect(family.every((p) => p.alive)).toBe(true);
  });

  it('sometimes includes a sibling', () => {
    setRngSource(() => 0); // chance(0.5) true => sibling added
    const family = createInitialFamily();
    expect(family.some((p) => p.relation === 'sibling')).toBe(true);
  });
});

describe('addPerson', () => {
  it('adds a new living person and logs history', () => {
    const char = baseCharacter({ relationships: [], history: [] });
    const next = addPerson(char, 'friend', { name: 'Alex', startingMeter: 70 });
    expect(next.relationships).toHaveLength(1);
    expect(next.relationships[0]).toMatchObject({ name: 'Alex', relation: 'friend', alive: true, relationshipMeter: 70 });
    expect(next.history.at(-1)?.text).toContain('Alex');
  });

  it('blocks adding a partner for a character under 16', () => {
    const char = baseCharacter({ age: 12, relationships: [] });
    expect(addPerson(char, 'partner')).toBe(char);
  });

  it('still allows adding a friend for a character under 16', () => {
    const char = baseCharacter({ age: 8, relationships: [] });
    const next = addPerson(char, 'friend');
    expect(next.relationships).toHaveLength(1);
  });
});

describe('interact', () => {
  it('talk increases meter and happiness for free', () => {
    const char = baseCharacter({ relationships: [person({ relationshipMeter: 50 })], happiness: 50, money: 100 });
    const next = interact(char, 'p1', 'talk');
    expect(next.relationships[0].relationshipMeter).toBe(55);
    expect(next.happiness).toBe(52);
    expect(next.money).toBe(100);
  });

  it('gift costs money and boosts meter more than talk', () => {
    const char = baseCharacter({ relationships: [person({ relationshipMeter: 50 })], money: 100 });
    const next = interact(char, 'p1', 'gift');
    expect(next.relationships[0].relationshipMeter).toBe(60);
    expect(next.money).toBe(80);
  });

  it('date is a no-op for a non-couple relation', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'friend' })] });
    expect(interact(char, 'p1', 'date')).toBe(char);
  });

  it('date works for a partner', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'partner', relationshipMeter: 50 })] });
    const next = interact(char, 'p1', 'date');
    expect(next.relationships[0].relationshipMeter).toBe(58);
  });

  it('is a no-op for an unknown person id', () => {
    const char = baseCharacter({ relationships: [] });
    expect(interact(char, 'missing', 'talk')).toBe(char);
  });
});

describe('propose', () => {
  it('succeeds and marries when the meter is high enough', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'partner', relationshipMeter: 75 })], happiness: 50 });
    const { character: next, success } = propose(char, 'p1');
    expect(success).toBe(true);
    expect(next.relationships[0].relation).toBe('spouse');
    expect(next.happiness).toBe(65);
  });

  it('fails when the meter is too low', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'partner', relationshipMeter: 40 })] });
    const { character: next, success } = propose(char, 'p1');
    expect(success).toBe(false);
    expect(next.relationships[0].relation).toBe('partner');
  });

  it('fails for a non-partner relation', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'friend', relationshipMeter: 90 })] });
    const { success } = propose(char, 'p1');
    expect(success).toBe(false);
  });
});

describe('breakUp', () => {
  it('converts a partner to an ex and lowers happiness', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'partner' })], happiness: 50 });
    const next = breakUp(char, 'p1');
    expect(next.relationships[0].relation).toBe('exPartner');
    expect(next.happiness).toBe(42);
  });

  it('is a no-op for a non-couple relation', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'friend' })] });
    expect(breakUp(char, 'p1')).toBe(char);
  });
});

describe('applyRelationshipEffect', () => {
  it('addPerson adds a new person', () => {
    const char = baseCharacter({ relationships: [] });
    const next = applyRelationshipEffect(char, { type: 'addPerson', relation: 'friend', startingMeter: 40 });
    expect(next.relationships).toHaveLength(1);
    expect(next.relationships[0].relationshipMeter).toBe(40);
  });

  it('modifyMeter adjusts an existing living person and clamps 0-100', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'parent', relationshipMeter: 95 })] });
    const next = applyRelationshipEffect(char, { type: 'modifyMeter', relation: 'parent', delta: 20 });
    expect(next.relationships[0].relationshipMeter).toBe(100);
  });

  it('modifyMeter is a no-op when no matching living person exists', () => {
    const char = baseCharacter({ relationships: [] });
    expect(applyRelationshipEffect(char, { type: 'modifyMeter', relation: 'parent', delta: 20 })).toBe(char);
  });

  it('marry promotes a partner to spouse', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'partner' })] });
    const next = applyRelationshipEffect(char, { type: 'marry', relation: 'partner' });
    expect(next.relationships[0].relation).toBe('spouse');
  });

  it('breakup demotes to exPartner', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'spouse' })] });
    const next = applyRelationshipEffect(char, { type: 'breakup', relation: 'spouse' });
    expect(next.relationships[0].relation).toBe('exPartner');
  });

  it('kill marks the person dead and logs history', () => {
    const char = baseCharacter({ relationships: [person({ relation: 'parent' })], history: [] });
    const next = applyRelationshipEffect(char, { type: 'kill', relation: 'parent', cause: 'illness' });
    expect(next.relationships[0].alive).toBe(false);
    expect(next.history.at(-1)?.text).toContain('passed away');
  });
});

describe('applyRelationshipYearlyTick', () => {
  it('is a no-op when there are no relationships', () => {
    const char = baseCharacter({ relationships: [] });
    expect(applyRelationshipYearlyTick(char)).toBe(char);
  });

  it('ages every living person and drifts their meter, silently', () => {
    setRngSource(() => 0); // meter drift randInt(-3,2) => -3; no death (age stays under 70)
    const char = baseCharacter({
      relationships: [person({ age: 40, relationshipMeter: 50 })],
      history: [],
    });
    const next = applyRelationshipYearlyTick(char);
    expect(next.relationships[0].age).toBe(41);
    expect(next.relationships[0].relationshipMeter).toBe(47);
    expect(next.history).toHaveLength(0);
  });

  it('can kill off an elderly relationship and log it', () => {
    setRngSource(() => 0); // guarantees the death roll for age > 70
    const char = baseCharacter({
      relationships: [person({ age: 74, relationshipMeter: 50 })],
      history: [],
    });
    const next = applyRelationshipYearlyTick(char);
    expect(next.relationships[0].alive).toBe(false);
    expect(next.history.at(-1)?.text).toContain('passed away');
  });

  it('does not roll death for someone already deceased', () => {
    setRngSource(() => 0);
    const char = baseCharacter({
      relationships: [person({ age: 90, alive: false })],
      history: [],
    });
    const next = applyRelationshipYearlyTick(char);
    expect(next.relationships[0].age).toBe(90);
    expect(next.history).toHaveLength(0);
  });
});
