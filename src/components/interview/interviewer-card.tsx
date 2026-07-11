'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { InterviewerConfig } from '@/types/interview';

const AVATAR_GRADIENTS: Record<string, string> = {
  hr: 'from-brand to-brand-hover',
  technical: 'from-blue-500 to-blue-400',
  scenario: 'from-amber-500 to-amber-400',
  behavioral: 'from-purple-500 to-purple-400',
  project_deep_dive: 'from-green-500 to-green-400',
  leader: 'from-slate-600 to-slate-500',
};

const SELECTED_BORDERS: Record<string, string> = {
  hr: 'border-brand',
  technical: 'border-blue-500',
  scenario: 'border-amber-500',
  behavioral: 'border-purple-500',
  project_deep_dive: 'border-green-500',
  leader: 'border-slate-500',
};

const SELECTED_BGS: Record<string, string> = {
  hr: 'bg-brand-muted dark:bg-brand-muted',
  technical: 'bg-blue-50 dark:bg-blue-950/30',
  scenario: 'bg-amber-50 dark:bg-amber-950/30',
  behavioral: 'bg-purple-50 dark:bg-purple-950/30',
  project_deep_dive: 'bg-green-50 dark:bg-green-950/30',
  leader: 'bg-slate-50 dark:bg-slate-950/30',
};

const BADGE_COLORS: Record<string, string> = {
  hr: 'bg-brand',
  technical: 'bg-blue-500',
  scenario: 'bg-amber-500',
  behavioral: 'bg-purple-500',
  project_deep_dive: 'bg-green-500',
  leader: 'bg-slate-500',
};

interface InterviewerCardProps {
  interviewer: InterviewerConfig;
  selected: boolean;
  onToggle: () => void;
  index?: number;
}

export function InterviewerCard({ interviewer, selected, onToggle, index }: InterviewerCardProps) {
  const t = useTranslations('interview.interviewers');
  const type = interviewer.type.startsWith('custom_') ? 'custom' : interviewer.type;
  const gradient = AVATAR_GRADIENTS[type] || 'from-zinc-500 to-zinc-400';
  const borderColor = SELECTED_BORDERS[type] || 'border-zinc-500';
  const bgColor = SELECTED_BGS[type] || 'bg-zinc-50 dark:bg-zinc-950/30';
  const badgeColor = BADGE_COLORS[type] || 'bg-zinc-500';

  return (
    <div
      className={cn(
        'relative flex min-w-[100px] cursor-pointer flex-col items-center rounded-xl border-2 p-3 text-center transition-all hover:shadow-md',
        selected ? `${borderColor} ${bgColor}` : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50'
      )}
      onClick={onToggle}
    >
      {selected && index !== undefined && (
        <div className={cn('absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white', badgeColor)}>
          {index + 1}
        </div>
      )}
      <div className={cn('mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white', gradient)}>
        {interviewer.name[0]}
      </div>
      <div className="text-[11px] font-semibold leading-tight">{interviewer.name}</div>
      <div className="text-[9px] text-zinc-400">{t(type as any)}</div>
    </div>
  );
}
