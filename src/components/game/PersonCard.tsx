'use client';

import type { Person } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

const RELATION_LABEL: Record<Person['relation'], string> = {
  parent: 'Parent',
  sibling: 'Sibling',
  friend: 'Friend',
  partner: 'Partner',
  spouse: 'Spouse',
  child: 'Child',
  exPartner: 'Ex',
};

export function PersonCard({
  person,
  onInteract,
  onPropose,
  onBreakUp,
}: {
  person: Person;
  onInteract: (personId: string, kind: 'talk' | 'gift' | 'date') => void;
  onPropose: (personId: string) => void;
  onBreakUp: (personId: string) => void;
}) {
  const isCouple = person.relation === 'partner' || person.relation === 'spouse';

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-neutral-900 dark:text-white">{person.name}</p>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {RELATION_LABEL[person.relation]} · Age {person.age}
        </span>
      </div>

      {!person.alive ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">Deceased</p>
      ) : (
        <>
          <ProgressBar label="Relationship" value={person.relationshipMeter} colorClass="bg-pink-500" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onInteract(person.id, 'talk')}>
              Talk
            </Button>
            <Button variant="secondary" onClick={() => onInteract(person.id, 'gift')}>
              Gift
            </Button>
            {isCouple && (
              <Button variant="secondary" onClick={() => onInteract(person.id, 'date')}>
                Date
              </Button>
            )}
            {person.relation === 'partner' && (
              <Button variant="primary" onClick={() => onPropose(person.id)}>
                Propose
              </Button>
            )}
            {isCouple && (
              <Button variant="danger" onClick={() => onBreakUp(person.id)}>
                Break Up
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
