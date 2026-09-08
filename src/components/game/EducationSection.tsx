'use client';

import { useGameStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MAJOR_CATALOG } from '@/lib/data/majors';
import type { Character } from '@/lib/types';

const LEVEL_LABEL: Record<string, string> = {
  none: 'Not enrolled',
  primary: 'Primary School',
  highschool: 'Highschool',
  university: 'University',
  gradschool: 'Grad School',
};

export function EducationSection({ character }: { character: Character }) {
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
          {education.dropoutFlag && <p className="text-xs text-danger">You dropped out.</p>}
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
