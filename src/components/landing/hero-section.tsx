'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateThumbnail } from '@/components/dashboard/template-thumbnail';
import SoftAurora from './soft-aurora';
import SplitText from './split-text';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const [titleComplete, setTitleComplete] = useState(false);

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pt-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <SoftAurora
          speed={0.52}
          scale={1.7}
          brightness={0.95}
          color1="#f7f7f7"
          color2="#00d4a3"
          noiseFrequency={2.4}
          noiseAmplitude={0.95}
          bandHeight={0.58}
          bandSpread={0.9}
          octaveDecay={0.12}
          layerOffset={0.28}
          colorSpeed={0.72}
          mouseInfluence={0.14}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-white/80 dark:bg-zinc-950/70" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_52%,white_86%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgb(9_9_11)_88%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <Badge
          variant="secondary"
          className="mb-6 border-brand-muted bg-brand-muted px-4 py-1.5 text-sm text-brand dark:border-brand-muted dark:bg-brand-muted dark:text-brand"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          AI-Powered
        </Badge>

        <SplitText
          tag="h1"
          text={t('title')}
          className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ display: 'block', width: '100%' }}
          delay={42}
          duration={0.72}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 44 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={() => setTitleComplete(true)}
        />

        <div className="mx-auto mt-6 max-w-2xl">
          {titleComplete && (
            <SplitText
              tag="p"
              text={t('subtitle')}
              className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg md:text-xl"
              style={{ display: 'block', width: '100%' }}
              delay={18}
              duration={0.58}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          )}
        </div>

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

        {/* Floating template cards */}
        <div className="hidden md:block">
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
        </div>
      </div>
    </section>
  );
}
