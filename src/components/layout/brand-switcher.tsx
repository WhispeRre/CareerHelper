'use client';

import { useTranslations } from 'next-intl';
import { useBrand, type Brand } from './brand-provider';
import { cn } from '@/lib/utils';

const OPTIONS: { id: Brand; swatch: string }[] = [
  { id: 'mint', swatch: '#00A77F' },
  { id: 'blue', swatch: '#2563eb' },
  { id: 'pink', swatch: '#ec4899' },
];

export function BrandSwitcher() {
  const { brand, setBrand } = useBrand();
  const t = useTranslations('brand');

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">{t('label')}</span>
      <div className="flex items-center gap-1">
        {OPTIONS.map((opt) => {
          const active = brand === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-label={t(`options.${opt.id}`)}
              title={t(`options.${opt.id}`)}
              onClick={() => setBrand(opt.id)}
              className={cn(
                'group relative h-3 w-3 cursor-pointer rounded-full transition-transform hover:scale-125',
                active && 'ring-1 ring-offset-1 ring-offset-background'
              )}
              style={{
                backgroundColor: opt.swatch,
                ...(active ? ({ '--tw-ring-color': opt.swatch } as React.CSSProperties) : {}),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
