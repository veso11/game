export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks' | 'talent';

export interface Person {
  id: string;
  name: string;
  relation: 'parent' | 'sibling' | 'friend' | 'partner' | 'spouse' | 'child' | 'exPartner';
  alive: boolean;
  age: number;
  relationshipMeter: number; // 0-100
}

export type RelationshipEffect =
  | { type: 'addPerson'; relation: Person['relation']; startingMeter?: number }
  | { type: 'modifyMeter'; relation: Person['relation']; delta: number }
  | { type: 'marry'; relation: 'partner' }
  | { type: 'breakup'; relation: 'partner' | 'spouse' }
  | { type: 'kill'; relation: Person['relation']; cause?: string };

export interface Job {
  id: string;
  title: string;
  salaryPerYear: number;
  level: number;
  yearsInJob: number;
  performance: number; // 0-100
}

export interface JobListing {
  id: string;
  title: string;
  minEducationLevel: EducationState['level'];
  minSmarts: number;
  minAge: number;
  baseSalaryPerYear: number;
  maxLevel: number;
}

export type JobEffect =
  | { type: 'grantJob'; listingId: string }
  | { type: 'promote' }
  | { type: 'quit' }
  | { type: 'fire' }
  | { type: 'performanceDelta'; delta: number };

export interface EducationState {
  level: 'none' | 'primary' | 'highschool' | 'university' | 'gradschool';
  currentGrade?: number;
  gpa?: number; // 0-4
  major?: string;
  enrolled: boolean;
  dropoutFlag: boolean;
}

export type EducationEffect =
  | { type: 'enroll'; level: EducationState['level']; major?: string }
  | { type: 'dropout' }
  | { type: 'gpaDelta'; delta: number };

export interface AssetItem {
  id: string;
  catalogId: string;
  type: 'car' | 'house' | 'item';
  name: string;
  value: number;
  happinessBonus: number;
}

export interface AssetCatalogEntry {
  id: string;
  type: AssetItem['type'];
  name: string;
  cost: number;
  happinessBonus: number;
  upkeepPerYear: number;
}

export type AssetEffect = { type: 'buy'; catalogId: string } | { type: 'sell'; assetId: string };

export interface HistoryEntry {
  id: string;
  age: number;
  text: string;
}

export interface CriminalRecord {
  inJail: boolean;
  yearsLeft: number;
  convictions: number;
}

export interface Character {
  id: string;
  name: string;
  country: string;
  city: string;
  age: number;
  alive: boolean;
  causeOfDeath?: string;

  health: number;
  happiness: number;
  smarts: number;
  looks: number;
  talent: number;
  money: number;

  relationships: Person[];
  job: Job | null;
  education: EducationState;
  assets: AssetItem[];
  achievements: string[];
  criminalRecord: CriminalRecord;
  firedEventIds: string[];

  history: HistoryEntry[];
  pendingEventId: string | null;
  eventQueue: string[];
}

export interface GameSave {
  character: Character;
  lastPlayed: number;
}

export type RelationshipStatus = 'single' | 'partnered' | 'married';

export interface EventChoice {
  label: string;
  effects: Partial<Record<StatKey | 'money', number>>;
  resultText: string;
  achievementId?: string;
  jobEffect?: JobEffect;
  relationshipEffect?: RelationshipEffect;
  educationEffect?: EducationEffect;
  assetEffect?: AssetEffect;
}

export interface EventRequirements {
  minStats?: Partial<Record<StatKey, number>>;
  maxStats?: Partial<Record<StatKey, number>>;
  educationLevel?: EducationState['level'][];
  hasJob?: boolean;
  relationshipStatus?: RelationshipStatus[];
  minMoney?: number;
  maxMoney?: number;
  minRelationshipMeter?: { relation: Person['relation']; min: number };
  hasAssetType?: AssetItem['type'];
}

export interface LifeEvent {
  id: string;
  minAge: number;
  maxAge: number;
  weight: number;
  once?: boolean;
  requires?: EventRequirements;
  text: string;
  choices: EventChoice[];
}
