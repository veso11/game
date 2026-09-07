'use client';

import type { LifeEvent } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export function EventCard({
  event,
  onChoose,
}: {
  event: LifeEvent;
  onChoose: (choiceIndex: number) => void;
}) {
  return (
    <div className="mx-4 my-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-medium text-ink mb-3">
        {event.text}
      </p>
      <div className="flex flex-col gap-2">
        {event.choices.map((choice, index) => (
          <Button
            key={choice.label}
            variant="secondary"
            className="text-left justify-start"
            onClick={() => onChoose(index)}
          >
            {choice.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
