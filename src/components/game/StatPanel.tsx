import type { Character } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function StatPanel({ character }: { character: Character }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
      <ProgressBar label="Health" value={character.health} colorClass="bg-red-500" />
      <ProgressBar label="Happiness" value={character.happiness} colorClass="bg-yellow-500" />
      <ProgressBar label="Smarts" value={character.smarts} colorClass="bg-blue-500" />
      <ProgressBar label="Looks" value={character.looks} colorClass="bg-pink-500" />
      <ProgressBar label="Talent" value={character.talent ?? 50} colorClass="bg-purple-500" />
      <div className="col-span-2 flex justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-200 pt-1">
        <span>Money</span>
        <span>${character.money.toLocaleString()}</span>
      </div>
    </div>
  );
}
