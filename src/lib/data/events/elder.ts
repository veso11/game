import type { LifeEvent } from '@/lib/types';

export const ELDER_EVENTS: LifeEvent[] = [
  {
    id: 'elder_retirement',
    minAge: 65,
    maxAge: 68,
    weight: 12,
    once: true,
    requires: { hasJob: true },
    text: 'You\'re eligible to retire from your job.',
    choices: [
      { label: 'Retire', effects: { happiness: 8, money: 0 }, resultText: 'You said goodbye to the working world for good.' },
      { label: 'Keep working', effects: { money: 20, happiness: -2 }, resultText: 'You weren\'t ready to slow down yet.' },
    ],
  },
  {
    id: 'elder_grandkids_visit',
    minAge: 65,
    maxAge: 95,
    weight: 8,
    requires: { relationshipStatus: ['married', 'partnered', 'single'] },
    text: 'Family came to visit for the weekend.',
    choices: [
      { label: 'Spend time with them', effects: { happiness: 8 }, resultText: 'It was a wonderful, loud, happy weekend.' },
      { label: 'Take it easy instead', effects: { health: 2, happiness: 2 }, resultText: 'You enjoyed some quiet rest.' },
    ],
  },
  {
    id: 'elder_health_scare',
    minAge: 66,
    maxAge: 95,
    weight: 8,
    text: 'You\'ve been feeling more tired than usual lately.',
    choices: [
      { label: 'See a doctor', effects: { health: 6, money: -20 }, resultText: 'Nothing serious, just needed some adjustments to your routine.' },
      { label: 'Rest at home', effects: { health: -4 }, resultText: 'You figured it would pass on its own.' },
    ],
  },
  {
    id: 'elder_memoir',
    minAge: 65,
    maxAge: 90,
    weight: 5,
    once: true,
    text: 'You\'ve thought about writing down your life story.',
    choices: [
      { label: 'Start writing', effects: { happiness: 6, smarts: 2 }, resultText: 'You filled notebooks with memories for your family.' },
      { label: 'Maybe later', effects: {}, resultText: 'There\'s always tomorrow.' },
    ],
  },
  {
    id: 'elder_garden',
    minAge: 65,
    maxAge: 95,
    weight: 7,
    text: 'It\'s a nice day to work in the garden.',
    choices: [
      { label: 'Spend the day gardening', effects: { happiness: 4, health: 2 }, resultText: 'The fresh air did you good.' },
      { label: 'Stay inside', effects: { happiness: -1 }, resultText: 'You watched TV instead.' },
    ],
  },
  {
    id: 'elder_old_friend',
    minAge: 65,
    maxAge: 95,
    weight: 6,
    text: 'An old friend called to catch up.',
    choices: [
      { label: 'Talk for hours', effects: { happiness: 6 }, resultText: 'It felt like no time had passed at all.' },
      { label: 'Keep it brief', effects: { happiness: 1 }, resultText: 'You promised to call back soon.' },
    ],
  },
  {
    id: 'elder_fall_risk',
    minAge: 70,
    maxAge: 95,
    weight: 6,
    text: 'You slipped on the stairs at home.',
    choices: [
      { label: 'Get it checked out', effects: { health: -3, money: -15 }, resultText: 'Just a bruise, but better safe than sorry.' },
      { label: 'Walk it off', effects: { health: -6 }, resultText: 'It was worse than you thought.' },
    ],
  },
  {
    id: 'elder_bucket_list',
    minAge: 65,
    maxAge: 90,
    weight: 6,
    once: true,
    requires: { minMoney: 50 },
    text: 'You\'ve always wanted to take one big trip.',
    choices: [
      { label: 'Book the trip', effects: { money: -50, happiness: 10 }, resultText: 'It was everything you dreamed of and more.' },
      { label: 'Stay home and save', effects: { happiness: -2 }, resultText: 'Maybe you\'ll go someday.' },
    ],
  },
];
