export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pickWeighted<T>(items: T[], weightOf: (item: T) => number): T | null {
  if (items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + weightOf(item), 0);
  if (totalWeight <= 0) return items[randInt(0, items.length - 1)];
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[randInt(0, items.length - 1)];
}
