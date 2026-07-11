'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Plus } from 'lucide-react';
import { InterviewerCard } from './interviewer-card';
import { CustomInterviewerDialog } from './custom-interviewer-dialog';
import { getPresetInterviewers } from '@/lib/interview/interviewers';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerPickerProps {
  selected: InterviewerConfig[];
  onChange: (selected: InterviewerConfig[]) => void;
}

export function InterviewerPicker({ selected, onChange }: InterviewerPickerProps) {
  const t = useTranslations('interview.setup');
  const locale = useLocale() as 'zh' | 'en';
  const presets = getPresetInterviewers(locale);

  const allInterviewers = [
    ...presets,
    ...selected.filter((s) => s.type.startsWith('custom_')),
  ];

  const toggleInterviewer = (interviewer: InterviewerConfig) => {
    const exists = selected.find((s) => s.type === interviewer.type);
    if (exists) {
      onChange(selected.filter((s) => s.type !== interviewer.type));
    } else {
      onChange([...selected, interviewer]);
    }
  };

  const handleAddCustom = (config: InterviewerConfig) => {
    onChange([...selected, config]);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white ${selected.length > 0 ? 'bg-brand' : 'bg-zinc-400 dark:bg-zinc-600'}`}>3</span>
        {t('interviewerLabel')}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allInterviewers.map((interviewer) => {
          const selectedIndex = selected.findIndex((s) => s.type === interviewer.type);
          return (
            <InterviewerCard
              key={interviewer.type}
              interviewer={interviewer}
              selected={selectedIndex >= 0}
              onToggle={() => toggleInterviewer(interviewer)}
              index={selectedIndex >= 0 ? selectedIndex : undefined}
            />
          );
        })}
        <CustomInterviewerDialog
          onAdd={handleAddCustom}
          trigger={
            <div className="flex min-w-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50">
              <Plus className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
              <span className="mt-1 text-[10px] text-zinc-400">{t('customInterviewer')}</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
