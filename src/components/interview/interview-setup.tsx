'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JDInput } from './jd-input';
import { ResumeSelector } from './resume-selector';
import { InterviewerPicker } from './interviewer-picker';
import { useRouter } from '@/i18n/routing';
import { getAIHeaders } from '@/stores/settings-store';
import type { InterviewerConfig } from '@/types/interview';

export function InterviewSetup() {
  const t = useTranslations('interview.setup');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [jd, setJd] = useState('');
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [selectedInterviewers, setSelectedInterviewers] = useState<InterviewerConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const canStart = jd.trim().length > 0 && selectedInterviewers.length > 0;

  const handleStart = async () => {
    if (!canStart) return;
    setIsCreating(true);

    try {
      const fp = getStoredFingerprint();
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fp ? { 'x-fingerprint': fp } : {}),
          ...getAIHeaders(),
        },
        body: JSON.stringify({
          jobDescription: jd,
          jobTitle: title.trim() || jd.split('\n')[0].slice(0, 100) || 'Interview',
          resumeId,
          interviewers: selectedInterviewers,
        }),
      });

      if (!res.ok) throw new Error('Failed to create interview');
      const { session } = await res.json();
      router.push(`/interview/${session.id}`);
    } catch (err) {
      console.error('Failed to create interview:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-muted to-white px-6 py-5 dark:from-brand-muted/30 dark:to-zinc-900">
        <h1 className="text-xl font-bold">🎙️ {t('title')}</h1>
      </div>
      <div className="space-y-6 px-1">
        {/* Title input */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">0</span>
            {t('titleLabel')}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="rounded-xl"
          />
        </div>
        <JDInput value={jd} onChange={setJd} />
        <ResumeSelector value={resumeId} onChange={setResumeId} />
        <InterviewerPicker selected={selectedInterviewers} onChange={setSelectedInterviewers} />
      </div>
      <div className="mt-8 px-1">
        <Button
          onClick={handleStart}
          disabled={!canStart || isCreating}
          className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-hover py-6 text-base font-semibold hover:from-brand-hover hover:to-brand-hover"
          size="lg"
        >
          {isCreating ? '...' : t('startInterview')}
        </Button>
      </div>
    </div>
  );
}
