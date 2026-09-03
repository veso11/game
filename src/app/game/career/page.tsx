'use client';

import { useGameStore } from '@/lib/store';
import { listAvailableJobs } from '@/lib/engine/career';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { JobCard } from '@/components/game/JobCard';

export default function CareerPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const applyForJob = useGameStore((state) => state.applyForJob);
  const quitJob = useGameStore((state) => state.quitJob);
  const requestRaise = useGameStore((state) => state.requestRaise);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {character.job ? (
        <Card className="space-y-3">
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">{character.job.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Level {character.job.level} · ${character.job.salaryPerYear.toLocaleString()}/yr
            </p>
          </div>
          <ProgressBar label="Performance" value={character.job.performance} colorClass="bg-emerald-500" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={requestRaise}>
              Request Raise
            </Button>
            <Button variant="danger" onClick={quitJob}>
              Quit Job
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            You&apos;re not currently employed. Here&apos;s what you&apos;re eligible for:
          </p>
          {listAvailableJobs(character).map((listing) => (
            <JobCard key={listing.id} listing={listing} onApply={applyForJob} />
          ))}
          {listAvailableJobs(character).length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Nothing available yet — try improving your smarts or education.
            </p>
          )}
        </>
      )}
    </div>
  );
}
