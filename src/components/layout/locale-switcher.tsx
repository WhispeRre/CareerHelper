'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales, localeNames } from '@/i18n/config';
import { ChevronDownIcon, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onValueChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Switch language"
        className="flex h-9 w-auto items-center gap-1.5 rounded-md border-none bg-transparent px-2 text-sm text-zinc-900 shadow-none dark:text-zinc-100"
      >
        <Globe className="h-4 w-4 text-zinc-500" />
        <span>{localeNames[locale as keyof typeof localeNames]}</span>
        <ChevronDownIcon className="size-4 opacity-50" />
      </button>
    );
  }

  return (
    <Select value={locale} onValueChange={onValueChange}>
      <SelectTrigger className="w-auto gap-1.5 border-none bg-transparent px-2 text-sm shadow-none">
        <Globe className="h-4 w-4 text-zinc-500" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
