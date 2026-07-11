'use client';

import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';

const MAX_JD_LENGTH = 5000;

interface JDInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JDInput({ value, onChange }: JDInputProps) {
  const t = useTranslations('interview.setup');

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">1</span>
        {t('jdLabel')}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_JD_LENGTH))}
        placeholder={t('jdPlaceholder')}
        className="min-h-[120px] resize-y rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
      />
      <p className="mt-1 text-right text-[10px] text-zinc-300 dark:text-zinc-600">
        {t('jdCharCount', { count: value.length })}
      </p>
    </div>
  );
}
