'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { listAvailableJobs } from '@/lib/engine/career';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { JobCard } from '@/components/game/JobCard';
import { MAJOR_CATALOG } from '@/lib/data/majors';
import type { Character, JobField, JobListing } from '@/lib/types';

const FIELD_LABELS: Record<JobField, string> = {
  general: 'General',
  business: 'Business',
  finance: 'Finance',
  tech: 'Tech',
  medicine: 'Medicine',
  law: 'Law',
  psychology: 'Psychology',
  law_enforcement: 'Law Enforcement',
  entertainment: 'Entertainment',
  sports: 'Sports',
};

const FIELD_ORDER = Object.keys(FIELD_LABELS) as JobField[];

const LEVEL_LABEL: Record<string, string> = {
  none: 'Not enrolled',
  primary: 'Primary School',
  highschool: 'Highschool',
  university: 'University',
  gradschool: 'Grad School',
};

function groupByField(listings: JobListing[]): Array<[JobField, JobListing[]]> {
  const groups = new Map<JobField, JobListing[]>();
  for (const listing of listings) {
    const bucket = groups.get(listing.field);
    if (bucket) bucket.push(listing);
    else groups.set(listing.field, [listing]);
  }
  return FIELD_ORDER.filter((field) => groups.has(field)).map((field) => [field, groups.get(field)!]);
}

function CareerSection({ character }: { character: Character }) {
  const applyForJob = useGameStore((state) => state.applyForJob);
  const quitJob = useGameStore((state) => state.quitJob);
  const requestRaise = useGameStore((state) => state.requestRaise);

  return character.job ? (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold text-ink">{character.job.title}</p>
        <p className="text-xs text-ink-muted">
          Level {character.job.level} · ${character.job.salaryPerYear.toLocaleString()}/yr
        </p>
      </div>
      <ProgressBar label="Performance" value={character.job.performance} colorClass="bg-accent" />
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
      <p className="text-sm text-ink-muted">
        You&apos;re not currently employed. Here&apos;s what you&apos;re eligible for:
      </p>
      {groupByField(listAvailableJobs(character)).map(([field, listings]) => (
        <div key={field} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {FIELD_LABELS[field]}
          </p>
          {listings.map((listing) => (
            <JobCard key={listing.id} listing={listing} onApply={applyForJob} />
          ))}
        </div>
      ))}
      {listAvailableJobs(character).length === 0 && (
        <p className="text-sm text-ink-muted">
          Nothing available yet — try improving your smarts or education.
        </p>
      )}
    </>
  );
}

function EducationSection({ character }: { character: Character }) {
  const enrollInSchool = useGameStore((state) => state.enrollInSchool);
  const dropOutOfSchool = useGameStore((state) => state.dropOutOfSchool);
  const studyHard = useGameStore((state) => state.studyHard);

  const { education } = character;
  const canEnrollUniversity = education.level === 'highschool' && !education.enrolled && !education.dropoutFlag;
  const canEnrollGradschool = education.level === 'university' && !education.enrolled && !education.dropoutFlag;

  return (
    <>
      <Card className="space-y-3">
        <div>
          <p className="font-semibold text-ink">{LEVEL_LABEL[education.level]}</p>
          {education.enrolled && (
            <p className="text-xs text-ink-muted">
              Grade {education.currentGrade} {education.major ? `· ${education.major}` : ''}
            </p>
          )}
          {education.dropoutFlag && (
            <p className="text-xs text-danger">You dropped out.</p>
          )}
        </div>
        {education.enrolled && education.gpa !== undefined && (
          <ProgressBar label="GPA" value={Math.round((education.gpa / 4) * 100)} colorClass="bg-blue-500" />
        )}
        {education.enrolled && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={studyHard}>
              Study Hard
            </Button>
            <Button variant="danger" onClick={dropOutOfSchool}>
              Drop Out
            </Button>
          </div>
        )}
      </Card>

      {canEnrollUniversity && (
        <Card className="space-y-2">
          <p className="font-semibold text-ink">Enroll in University</p>
          <p className="text-xs text-ink-muted">Tuition: $200</p>
          <div className="flex flex-wrap gap-2">
            {MAJOR_CATALOG.map((major) => (
              <Button key={major.id} variant="secondary" onClick={() => enrollInSchool('university', major.id)}>
                {major.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {canEnrollGradschool && (
        <Card className="space-y-2">
          <p className="font-semibold text-ink">Enroll in Grad School</p>
          <p className="text-xs text-ink-muted">Tuition: $400</p>
          <div className="flex flex-wrap gap-2">
            {MAJOR_CATALOG.map((major) => (
              <Button key={major.id} variant="secondary" onClick={() => enrollInSchool('gradschool', major.id)}>
                {major.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

export default function CareerPage() {
  const [tab, setTab] = useState<'career' | 'education'>('career');
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <SegmentedControl
        options={[
          { id: 'career', label: 'Career' },
          { id: 'education', label: 'Education' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'career' ? <CareerSection character={character} /> : <EducationSection character={character} />}
    </div>
  );
}
