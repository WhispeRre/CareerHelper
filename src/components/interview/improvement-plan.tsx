'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ImprovementItem } from '@/types/interview';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface ImprovementPlanProps {
  items: ImprovementItem[];
}

export function ImprovementPlan({ items }: ImprovementPlanProps) {
  const t = useTranslations('interview.report');

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
      <h3 className="mb-4 text-lg font-semibold">{t('improvement')}</h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge className={cn(PRIORITY_COLORS[item.priority])}>{t(`priority.${item.priority}`)}</Badge>
              <span className="font-medium">{item.area}</span>
            </div>
            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            {item.resources.length > 0 && (
              <div>
                <span className="text-xs font-medium text-zinc-500">{t('resources')}:</span>
                <ul className="ml-4 list-disc text-xs text-zinc-500">
                  {item.resources.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
