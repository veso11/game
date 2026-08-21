import type { LifeEvent } from '@/lib/types';
import { CHILDHOOD_EVENTS } from './childhood';
import { TEEN_EVENTS } from './teen';
import { ADULT_EVENTS } from './adult';
import { ELDER_EVENTS } from './elder';

export const ALL_EVENTS: LifeEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...TEEN_EVENTS,
  ...ADULT_EVENTS,
  ...ELDER_EVENTS,
];

export function getEventById(id: string): LifeEvent | undefined {
  return ALL_EVENTS.find((e) => e.id === id);
}
