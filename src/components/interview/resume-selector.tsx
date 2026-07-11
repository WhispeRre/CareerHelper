'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Resume } from '@/types/resume';

interface ResumeSelectorProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function ResumeSelector({ value, onChange }: ResumeSelectorProps) {
  const t = useTranslations('interview.setup');
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    const fp = getStoredFingerprint();
    fetch('/api/resume', {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then((data) => setResumes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-400 text-[10px] font-bold text-white dark:bg-zinc-600">2</span>
        {t('resumeLabel')}
      </div>
      <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? undefined : v)}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder={t('resumePlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{t('resumeNone')}</SelectItem>
          {resumes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-zinc-400">{t('resumeHint')}</p>
    </div>
  );
}
