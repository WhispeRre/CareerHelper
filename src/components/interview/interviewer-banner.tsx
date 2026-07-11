'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { useInterviewStore } from '@/stores/interview-store';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerBannerProps {
  config: InterviewerConfig;
  questionCount: number;
}

export function InterviewerBanner({ config, questionCount }: InterviewerBannerProps) {
  const t = useTranslations('interview.interviewers');
  const { rounds, currentRoundIndex } = useInterviewStore();
  const currentRound = rounds[currentRoundIndex];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-muted bg-gradient-to-r from-brand-muted/80 to-white p-3 dark:border-brand-muted dark:from-brand-muted/30 dark:to-zinc-900">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-lg font-bold text-white">
        {config.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{config.name}</span>
          <Badge variant="secondary" className="text-[10px]">
            {t(config.type.startsWith('custom_') ? 'custom' : (config.type as any))}
          </Badge>
        </div>
        <p className="truncate text-xs text-zinc-500">{config.style}</p>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-brand">{questionCount}</div>
        <div className="text-[10px] text-zinc-400">{currentRound?.maxQuestions ?? 10} 题</div>
      </div>
    </div>
  );
}
