let currentRng: () => number = Math.random;

/**
 * Deterministic mulberry32 PRNG, for seeding tests that exercise
 * probabilistic engine logic (hire chance, promotion rolls, etc).
 */
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function setRngSource(fn: () => number): void {
  currentRng = fn;
}

export function resetRngSource(): void {
  currentRng = Math.random;
}

export function randInt(min: number, max: number): number {
  return Math.floor(currentRng() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return currentRng() < probability;
}

export function pickWeighted<T>(items: T[], weightOf: (item: T) => number): T | null {
  if (items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + weightOf(item), 0);
  if (totalWeight <= 0) return items[randInt(0, items.length - 1)];
  let roll = currentRng() * totalWeight;
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
