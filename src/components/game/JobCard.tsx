'use client';

import type { JobListing } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function JobCard({ listing, onApply }: { listing: JobListing; onApply: (listingId: string) => void }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-ink">{listing.title}</p>
        <p className="text-xs text-ink-muted">
          ${listing.baseSalaryPerYear.toLocaleString()}/yr · min age {listing.minAge}
        </p>
      </div>
      <Button variant="secondary" onClick={() => onApply(listing.id)}>
        Apply
      </Button>
    </Card>
  );
}
