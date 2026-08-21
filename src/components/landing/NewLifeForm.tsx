'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { COUNTRIES } from '@/lib/data/names';

export function NewLifeForm() {
  const router = useRouter();
  const createLife = useGameStore((state) => state.createLife);
  const [name, setName] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);

  function handleStart() {
    createLife({ name, country });
    router.push('/game');
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <input
        type="text"
        placeholder="Name (leave blank for random)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
      />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
      >
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <Button onClick={handleStart}>Start New Life</Button>
    </div>
  );
}
