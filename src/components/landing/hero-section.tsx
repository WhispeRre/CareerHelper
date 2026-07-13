'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Iridescence from './iridescence';
import FadeContent from './fade-content';
import { HeroResumeShowcase } from './hero-resume-showcase';
import SplitText from './split-text';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const titleLines = t('title').split('\n');
  const subtitleLines = t('subtitle').split('\n');

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Iridescence color={[0.72, 1, 0.9]} mouseReact={false} amplitude={0.08} speed={0.75} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-white/72 dark:bg-zinc-950/68" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_54%,white_88%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgb(9_9_11)_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-zinc-950/70 dark:to-zinc-950" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 text-center lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1fr)] lg:gap-0 lg:text-left xl:gap-2">
        <div className="mx-auto max-w-3xl lg:mx-0">
          <Badge
            variant="secondary"
            className="mb-6 border-brand-muted bg-brand-muted px-4 py-1.5 text-sm text-brand dark:border-brand-muted dark:bg-brand-muted dark:text-brand"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI-Powered
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl">
            {titleLines.map((line, index) => (
              <SplitText
                key={line}
                tag="span"
                text={line}
                splitType="words, chars"
                delay={index * 180 + 28}
                duration={0.8}
                threshold={0.1}
                rootMargin="0px"
                textAlign="inherit"
                className="block"
              />
            ))}
          </h1>

          <div className="mx-auto mt-6 flex min-h-[4.75rem] max-w-2xl items-start justify-center sm:min-h-[4rem] md:min-h-[4.25rem] lg:mx-0 lg:justify-start">
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg md:text-xl">
              {subtitleLines.map((line, index) => (
                <SplitText
                  key={line}
                  tag="span"
                  text={line}
                  splitType="words"
                  delay={index * 120 + 42}
                  duration={0.75}
                  threshold={0.1}
                  rootMargin="0px"
                  textAlign="inherit"
                  className="block"
                />
              ))}
            </p>
          </div>

          <FadeContent blur duration={850} delay={120} ease="power2.out" threshold={0.1}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
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
        </div>

        <FadeContent blur duration={900} delay={180} ease="power2.out" threshold={0.1}>
          <HeroResumeShowcase />
        </FadeContent>
      </div>
    </section>
  );
}
