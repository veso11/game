'use client';

import { Button } from '@/components/ui/Button';

export function AgeUpButton({ onAgeUp, disabled }: { onAgeUp: () => void; disabled?: boolean }) {
  return (
    <div className="px-4 py-3 bg-surface border-t border-border">
      <Button className="w-full py-3 text-base" onClick={onAgeUp} disabled={disabled}>
        Age Up ▲
      </Button>
    </div>
  );
}
