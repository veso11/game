import type { Character } from '@/lib/types';
import { initMarket } from '@/lib/market/engine';

export function baseCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    name: 'Test',
    country: 'Testland',
    city: '',
    age: 20,
    alive: true,
    health: 50,
    happiness: 50,
    smarts: 50,
    looks: 50,
    talent: 50,
    money: 100,
    relationships: [],
    job: null,
    education: { level: 'none', enrolled: false, dropoutFlag: false },
    assets: [],
    achievements: [],
    criminalRecord: { inJail: false, yearsLeft: 0, convictions: 0 },
    firedEventIds: [],
    portfolio: [],
    market: initMarket(),
    conditions: [],
    gymMembership: false,
    history: [],
    pendingEventId: null,
    eventQueue: [],
    ...overrides,
  };
}
