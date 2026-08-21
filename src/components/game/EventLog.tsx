'use client';

import { useEffect, useRef } from 'react';
import type { HistoryEntry } from '@/lib/types';

export function EventLog({ history }: { history: HistoryEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {history.map((entry) => (
        <div key={entry.id} className="text-sm text-neutral-700 dark:text-neutral-200">
          <span className="text-neutral-400 dark:text-neutral-500 mr-2 tabular-nums">
            {entry.age}
          </span>
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
