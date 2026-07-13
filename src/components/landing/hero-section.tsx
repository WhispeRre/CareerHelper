'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateThumbnail } from '@/components/dashboard/template-thumbnail';
import Iridescence from './iridescence';
import FadeContent from './fade-content';

export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Iridescence color={[0.72, 1, 0.9]} mouseReact={false} amplitude={0.08} speed={0.75} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-white/72 dark:bg-zinc-950/68" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_54%,white_88%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgb(9_9_11)_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-zinc-950/70 dark:to-zinc-950" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <Badge
          variant="secondary"
          className="mb-6 border-brand-muted bg-brand-muted px-4 py-1.5 text-sm text-brand dark:border-brand-muted dark:bg-brand-muted dark:text-brand"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          AI-Powered
        </Badge>

        <FadeContent blur duration={850} ease="power2.out" threshold={0.1} className="w-full">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl">
            {t('title')}
          </h1>
        </FadeContent>

        <div className="mx-auto mt-6 flex min-h-[4.75rem] max-w-2xl items-start justify-center sm:min-h-[4rem] md:min-h-[4.25rem]">
          <FadeContent blur duration={850} ease="power2.out" threshold={0.1} className="w-full">
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg md:text-xl">
              {t('subtitle')}
            </p>
          </FadeContent>
        </div>

        <FadeContent blur duration={850} delay={120} ease="power2.out" threshold={0.1}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="h-12 w-full cursor-pointer rounded-xl bg-brand px-8 text-base font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-xl hover:shadow-brand/30 sm:h-11 sm:w-auto sm:px-6 sm:text-sm"
            >
              <Link href="/dashboard">{t('cta')}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full cursor-pointer rounded-xl border-zinc-300 px-8 text-base font-semibold transition-all hover:-translate-y-0.5 dark:border-zinc-700 sm:h-11 sm:w-auto sm:px-6 sm:text-sm"
            >
              <Link href="/templates">{t('secondaryCta')}</Link>
            </Button>
          </div>
        </FadeContent>

        {/* Floating template cards */}
        <FadeContent blur duration={900} delay={180} ease="power2.out" threshold={0.1} className="hidden md:block">
          <div className="mt-16 flex items-center justify-center gap-4 sm:gap-6 lg:mt-20">
            <div className="animate-float h-48 w-36 -rotate-6 overflow-hidden rounded-xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 dark:border-zinc-700 dark:shadow-zinc-900/50 sm:h-56 sm:w-40 lg:h-64 lg:w-48">
              <TemplateThumbnail template="modern" className="h-full w-full" />
            </div>
            <div className="animate-float-delayed h-56 w-40 overflow-hidden rounded-xl border border-brand-muted shadow-2xl shadow-brand-muted/30 dark:border-brand-muted dark:shadow-brand/30 sm:h-64 sm:w-48 lg:h-72 lg:w-52">
              <TemplateThumbnail template="classic" className="h-full w-full" />
            </div>
            <div
              className="animate-float h-48 w-36 rotate-6 overflow-hidden rounded-xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 dark:border-zinc-700 dark:shadow-zinc-900/50 sm:h-56 sm:w-40 lg:h-64 lg:w-48"
              style={{ animationDelay: '2s' }}
            >
              <TemplateThumbnail template="minimal" className="h-full w-full" />
            </div>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
