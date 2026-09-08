'use client';

import { useGameStore } from '@/lib/store';
import { getConditionById } from '@/lib/data/conditions';
import { DOCTOR_VISIT_COST } from '@/lib/engine/health';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HealthPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const visitDoctor = useGameStore((state) => state.visitDoctor);
  const toggleGymMembership = useGameStore((state) => state.toggleGymMembership);
  const goForWalk = useGameStore((state) => state.goForWalk);
  const doGardening = useGameStore((state) => state.doGardening);
  const readABook = useGameStore((state) => state.readABook);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const conditions = character.conditions ?? [];
  const canAffordDoctor = character.money >= DOCTOR_VISIT_COST;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Conditions</p>
        {conditions.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing active — you&apos;re in good health.</p>
        ) : (
          <div className="space-y-2">
            {conditions.map((active) => {
              const def = getConditionById(active.conditionId);
              if (!def) return null;
              return (
                <div key={active.conditionId} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-semibold text-ink">{def.name}</p>
                  <p className="text-xs text-ink-muted">{def.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">See a Doctor</p>
            <p className="text-xs text-ink-muted">${DOCTOR_VISIT_COST} · chance to cure active conditions</p>
          </div>
          <Button onClick={visitDoctor} disabled={!canAffordDoctor}>
            Visit
          </Button>
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">Gym Membership</p>
            <p className="text-xs text-ink-muted">$200/yr · small ongoing health boost while active</p>
          </div>
          <Button variant={character.gymMembership ? 'danger' : 'secondary'} onClick={toggleGymMembership}>
            {character.gymMembership ? 'Cancel' : 'Join'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Free Time</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={goForWalk}>
            Go for a Walk
          </Button>
          <Button variant="secondary" onClick={doGardening}>
            Gardening
          </Button>
          <Button variant="secondary" onClick={readABook}>
            Read a Book
          </Button>
        </div>
      </Card>
    </div>
  );
}
