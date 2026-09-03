'use client';

import { useGameStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

const LEVEL_LABEL: Record<string, string> = {
  none: 'Not enrolled',
  primary: 'Primary School',
  highschool: 'Highschool',
  university: 'University',
  gradschool: 'Grad School',
};

const MAJORS = ['Business', 'Engineering', 'Arts', 'Medicine', 'Law'];

export default function EducationPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const enrollInSchool = useGameStore((state) => state.enrollInSchool);
  const dropOutOfSchool = useGameStore((state) => state.dropOutOfSchool);
  const studyHard = useGameStore((state) => state.studyHard);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const { education } = character;
  const canEnrollUniversity = education.level === 'highschool' && !education.enrolled && !education.dropoutFlag;
  const canEnrollGradschool = education.level === 'university' && !education.enrolled && !education.dropoutFlag;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <Card className="space-y-3">
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">{LEVEL_LABEL[education.level]}</p>
          {education.enrolled && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Grade {education.currentGrade} {education.major ? `· ${education.major}` : ''}
            </p>
          )}
          {education.dropoutFlag && (
            <p className="text-xs text-red-500 dark:text-red-400">You dropped out.</p>
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
          <p className="font-semibold text-neutral-900 dark:text-white">Enroll in University</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Tuition: $200</p>
          <div className="flex flex-wrap gap-2">
            {MAJORS.map((major) => (
              <Button key={major} variant="secondary" onClick={() => enrollInSchool('university', major)}>
                {major}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {canEnrollGradschool && (
        <Card className="space-y-2">
          <p className="font-semibold text-neutral-900 dark:text-white">Enroll in Grad School</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Tuition: $400</p>
          <div className="flex flex-wrap gap-2">
            {MAJORS.map((major) => (
              <Button key={major} variant="secondary" onClick={() => enrollInSchool('gradschool', major)}>
                {major}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
