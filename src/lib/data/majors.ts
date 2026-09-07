import type { JobField } from '@/lib/types';

export type MajorId =
  | 'business'
  | 'finance'
  | 'computer_science'
  | 'psychology'
  | 'law'
  | 'medicine'
  | 'arts'
  | 'criminal_justice'
  | 'nursing'
  | 'education';

export interface Major {
  id: MajorId;
  label: string;
  field: JobField;
}

export const MAJOR_CATALOG: Major[] = [
  { id: 'business', label: 'Business', field: 'business' },
  { id: 'finance', label: 'Finance', field: 'finance' },
  { id: 'computer_science', label: 'Computer Science / Engineering', field: 'tech' },
  { id: 'psychology', label: 'Psychology', field: 'psychology' },
  { id: 'law', label: 'Law', field: 'law' },
  { id: 'medicine', label: 'Medicine', field: 'medicine' },
  { id: 'arts', label: 'Arts', field: 'general' },
  { id: 'criminal_justice', label: 'Criminal Justice', field: 'law_enforcement' },
  { id: 'nursing', label: 'Nursing / Health Sciences', field: 'medicine' },
  { id: 'education', label: 'Education', field: 'general' },
];

export function getMajorById(id?: string): Major | undefined {
  return MAJOR_CATALOG.find((major) => major.id === id);
}
