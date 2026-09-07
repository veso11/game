export type LifeStage = 'childhood' | 'teen' | 'adult' | 'elder';

const STAGE_ACCENT: Record<LifeStage, string> = {
  childhood: '#6fbf9e',
  teen: '#e8735c',
  adult: '#4a6fa5',
  elder: '#8b7ba8',
};

export function getLifeStage(age: number): LifeStage {
  if (age < 12) return 'childhood';
  if (age < 18) return 'teen';
  if (age < 65) return 'adult';
  return 'elder';
}

export function getStageAccent(age: number): string {
  return STAGE_ACCENT[getLifeStage(age)];
}
