'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { InterviewerBanner } from './interviewer-banner';
import type { InterviewerConfig } from '@/types/interview';

interface RoundTransitionProps {
  nextInterviewer: InterviewerConfig;
  onContinue: () => void;
  isLastRound?: boolean;
}

export function RoundTransition({ nextInterviewer, onContinue, isLastRound }: RoundTransitionProps) {
  const t = useTranslations('interview.room');

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
        {isLastRound ? t('allComplete') : t('roundComplete')}
      </p>
      {!isLastRound && (
        <>
          <div className="w-full max-w-md px-4">
            <InterviewerBanner config={nextInterviewer} questionCount={0} />
          </div>
          <Button onClick={onContinue} size="lg">
            {t('nextRound')}
          </Button>
        </>
      )}
      {isLastRound && (
        <Button onClick={onContinue} size="lg">
          {t('generateReport')}
        </Button>
      )}
    </div>
  );
}
