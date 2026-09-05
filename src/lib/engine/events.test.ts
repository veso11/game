import { describe, it, expect } from 'vitest';
import { eligibleEvents, meetsRequirements, pickEvent, resolveEvent } from './events';
import { baseCharacter } from '@/lib/testUtils';
import type { LifeEvent } from '@/lib/types';

const EVENT_LOW: LifeEvent = {
  id: 'low_weight',
  minAge: 0,
  maxAge: 100,
  weight: 1,
  text: 'Low weight event',
  choices: [{ label: 'OK', effects: { happiness: 1 }, resultText: 'Done.' }],
};

const EVENT_HIGH: LifeEvent = {
  id: 'high_weight',
  minAge: 0,
  maxAge: 100,
  weight: 99,
  text: 'High weight event',
  choices: [{ label: 'OK', effects: { happiness: 1 }, resultText: 'Done.' }],
};

const EVENT_ONCE: LifeEvent = {
  id: 'once_event',
  minAge: 0,
  maxAge: 100,
  weight: 10,
  once: true,
  text: 'Once event',
  choices: [{ label: 'OK', effects: {}, resultText: 'Done.' }],
};

describe('meetsRequirements', () => {
  it('passes with no requirements', () => {
    expect(meetsRequirements(baseCharacter(), undefined)).toBe(true);
  });

  it('enforces minStats', () => {
    const char = baseCharacter({ smarts: 30 });
    expect(meetsRequirements(char, { minStats: { smarts: 50 } })).toBe(false);
    expect(meetsRequirements(baseCharacter({ smarts: 60 }), { minStats: { smarts: 50 } })).toBe(true);
  });

  it('enforces maxStats', () => {
    const char = baseCharacter({ happiness: 80 });
    expect(meetsRequirements(char, { maxStats: { happiness: 50 } })).toBe(false);
    expect(meetsRequirements(baseCharacter({ happiness: 20 }), { maxStats: { happiness: 50 } })).toBe(true);
  });

  it('enforces educationLevel', () => {
    const char = baseCharacter({ education: { level: 'none', enrolled: false, dropoutFlag: false } });
    expect(meetsRequirements(char, { educationLevel: ['university'] })).toBe(false);
  });

  it('enforces hasJob', () => {
    const employed = baseCharacter({
      job: { id: 'j1', listingId: '', title: 'Clerk', salaryPerYear: 20, level: 1, yearsInJob: 1, performance: 50 },
    });
    expect(meetsRequirements(employed, { hasJob: true })).toBe(true);
    expect(meetsRequirements(baseCharacter({ job: null }), { hasJob: true })).toBe(false);
  });

  it('enforces relationshipStatus', () => {
    const married = baseCharacter({
      relationships: [{ id: 'p1', name: 'Partner', relation: 'spouse', alive: true, age: 30, relationshipMeter: 80 }],
    });
    expect(meetsRequirements(married, { relationshipStatus: ['married'] })).toBe(true);
    expect(meetsRequirements(baseCharacter(), { relationshipStatus: ['married'] })).toBe(false);
  });

  it('enforces minMoney', () => {
    expect(meetsRequirements(baseCharacter({ money: 10 }), { minMoney: 50 })).toBe(false);
    expect(meetsRequirements(baseCharacter({ money: 100 }), { minMoney: 50 })).toBe(true);
  });
});

describe('eligibleEvents', () => {
  it('excludes events outside the character age range', () => {
    const teenOnly: LifeEvent = { ...EVENT_LOW, id: 'teen_only', minAge: 13, maxAge: 17 };
    const child = baseCharacter({ age: 5 });
    expect(eligibleEvents(child, [teenOnly], new Set())).toEqual([]);
  });

  it('excludes already-fired once events', () => {
    const char = baseCharacter({ firedEventIds: [EVENT_ONCE.id] });
    expect(eligibleEvents(char, [EVENT_ONCE], new Set())).toEqual([]);
  });

  it('includes a not-yet-fired once event', () => {
    const char = baseCharacter({ firedEventIds: [] });
    expect(eligibleEvents(char, [EVENT_ONCE], new Set())).toEqual([EVENT_ONCE]);
  });

  it('excludes ids passed in excludeIds (already picked this year)', () => {
    const char = baseCharacter();
    expect(eligibleEvents(char, [EVENT_LOW], new Set([EVENT_LOW.id]))).toEqual([]);
  });
});

describe('pickEvent weighted selection', () => {
  it('heavily favors the higher-weighted event over many trials', () => {
    const char = baseCharacter();
    let highCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const picked = pickEvent(char, [EVENT_LOW, EVENT_HIGH], new Set());
      if (picked?.id === EVENT_HIGH.id) highCount++;
    }
    // weight 99 vs 1 => expect roughly 99% picks; assert comfortably above chance.
    expect(highCount / trials).toBeGreaterThan(0.9);
  });

  it('returns null when nothing is eligible', () => {
    const char = baseCharacter({ age: 200 });
    expect(pickEvent(char, [EVENT_LOW], new Set())).toBeNull();
  });
});

describe('resolveEvent', () => {
  it('applies the chosen effects and appends a history entry', () => {
    const char = baseCharacter({ happiness: 50, history: [] });
    const next = resolveEvent(char, EVENT_LOW, 0);
    expect(next.happiness).toBe(51);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].text).toContain('Low weight event');
  });

  it('marks a once event as fired', () => {
    const char = baseCharacter({ firedEventIds: [] });
    const next = resolveEvent(char, EVENT_ONCE, 0);
    expect(next.firedEventIds).toContain(EVENT_ONCE.id);
  });

  it('does not duplicate a once event across resolutions', () => {
    const char = baseCharacter({ firedEventIds: [EVENT_ONCE.id] });
    const next = resolveEvent(char, EVENT_ONCE, 0);
    expect(next.firedEventIds.filter((id) => id === EVENT_ONCE.id)).toHaveLength(1);
  });

  it('advances pendingEventId from the queue after resolving', () => {
    const char = baseCharacter({ pendingEventId: EVENT_LOW.id, eventQueue: ['next_event'] });
    const next = resolveEvent(char, EVENT_LOW, 0);
    expect(next.pendingEventId).toBe('next_event');
    expect(next.eventQueue).toEqual([]);
  });

  it('sets pendingEventId to null when the queue is empty', () => {
    const char = baseCharacter({ pendingEventId: EVENT_LOW.id, eventQueue: [] });
    const next = resolveEvent(char, EVENT_LOW, 0);
    expect(next.pendingEventId).toBeNull();
  });
});
