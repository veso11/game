import { NewLifeForm } from '@/components/landing/NewLifeForm';
import { SaveSlotList } from '@/components/landing/SaveSlotList';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-neutral-50 dark:bg-neutral-900 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Lifeline
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Live a life, one year at a time.
        </p>
      </div>
      <NewLifeForm />
      <div className="w-full max-w-xs border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Your Lives
        </h2>
        <SaveSlotList />
      </div>
    </div>
  );
}
