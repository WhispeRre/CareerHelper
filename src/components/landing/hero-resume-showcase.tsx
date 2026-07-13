'use client';

import { BadgeCheck, FileText, WandSparkles } from 'lucide-react';

import CardSwap, { Card } from './card-swap';

const cards = [
  {
    title: 'AI Optimized',
    template: 'modern',
    Icon: WandSparkles,
    accent: 'bg-pink-500',
  },
  {
    title: 'Multi-Template',
    template: 'classic',
    Icon: FileText,
    accent: 'bg-emerald-500',
  },
  {
    title: 'ATS Friendly',
    template: 'minimal',
    Icon: BadgeCheck,
    accent: 'bg-sky-500',
  },
];

function Line({ className = '' }: { className?: string }) {
  return <div className={`h-1.5 rounded-full bg-zinc-200 ${className}`} />;
}

function SkillBar({ value, className = 'bg-brand' }: { value: string; className?: string }) {
  return (
    <div className="h-2 rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${className}`} style={{ width: value }} />
    </div>
  );
}

function ModernPreview() {
  return (
    <div className="h-full bg-white px-5 py-4 dark:bg-zinc-950">
      <div className="mb-4 grid grid-cols-[1.1fr_0.9fr] gap-5">
        <div>
          <div className="mb-2 h-3 w-32 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          <div className="space-y-1.5">
            <Line className="w-full" />
            <Line className="w-11/12" />
            <Line className="w-4/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
            <Line className="mb-2 w-12 bg-zinc-400" />
            <SkillBar value="82%" className="bg-pink-500" />
          </div>
          <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
            <Line className="mb-2 w-10 bg-zinc-400" />
            <SkillBar value="68%" className="bg-pink-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[0.85fr_1.15fr] gap-5">
        <div className="space-y-3">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-3 h-2 w-16 rounded-full bg-pink-500" />
            <div className="space-y-1.5">
              <Line className="w-full" />
              <Line className="w-10/12" />
              <Line className="w-11/12" />
              <Line className="w-8/12" />
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-3 h-2 w-14 rounded-full bg-zinc-700 dark:bg-zinc-200" />
            <div className="grid grid-cols-2 gap-2">
              <SkillBar value="78%" className="bg-pink-500" />
              <SkillBar value="62%" className="bg-pink-400" />
              <SkillBar value="86%" className="bg-sky-500" />
              <SkillBar value="54%" className="bg-emerald-500" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="relative pl-5">
              <div
                className={`absolute left-0 top-1 h-2.5 w-2.5 rounded-full ${
                  item === 0 ? 'bg-pink-500' : item === 1 ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
              />
              <div className="absolute bottom-0 left-[4px] top-4 w-px bg-zinc-200" />
              <div className="rounded-lg border border-zinc-100 bg-white p-3 shadow-sm shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="h-2.5 w-24 rounded-full bg-zinc-800 dark:bg-zinc-100" />
                  <div className="h-2 w-12 rounded-full bg-zinc-300" />
                </div>
                <div className="space-y-1.5">
                  <Line className="w-full" />
                  <Line className="w-11/12" />
                  <Line className={item === 1 ? 'w-9/12 bg-pink-200' : 'w-9/12'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassicPreview() {
  return (
    <div className="h-full bg-white px-6 py-5 dark:bg-zinc-950">
      <div className="mb-4 border-b-2 border-zinc-800 pb-3 text-center dark:border-zinc-100">
        <div className="mx-auto mb-2 h-3 w-40 rounded-full bg-zinc-900 dark:bg-zinc-100" />
        <div className="mx-auto h-1.5 w-28 rounded-full bg-zinc-300" />
      </div>

      <div className="grid grid-cols-[1fr_1.35fr] gap-5">
        <aside className="space-y-3 border-r border-zinc-200 pr-4 dark:border-zinc-800">
          <div>
            <div className="mb-2 h-2 w-20 rounded-full bg-emerald-500" />
            <div className="space-y-1.5">
              <Line className="w-full" />
              <Line className="w-10/12" />
              <Line className="w-11/12" />
              <Line className="w-8/12 bg-pink-200" />
            </div>
          </div>
          <div>
            <div className="mb-2 h-2 w-16 rounded-full bg-zinc-700 dark:bg-zinc-200" />
            <div className="space-y-2">
              <SkillBar value="88%" className="bg-emerald-500" />
              <SkillBar value="72%" className="bg-sky-500" />
              <SkillBar value="64%" className="bg-pink-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 rounded-md bg-zinc-50 dark:bg-zinc-900" />
            <div className="h-10 rounded-md bg-zinc-50 dark:bg-zinc-900" />
          </div>
        </aside>

        <main className="space-y-3">
          {[0, 1, 2].map((item) => (
            <section key={item}>
              <div className="mb-2 flex items-center gap-2">
                <div className={`h-2 w-16 rounded-full ${item === 1 ? 'bg-pink-500' : 'bg-zinc-800 dark:bg-zinc-100'}`} />
                <div className="h-px flex-1 bg-zinc-200" />
              </div>
              <div className="space-y-1.5">
                <Line className="w-full" />
                <Line className="w-11/12" />
                <Line className="w-9/12" />
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="h-full bg-white px-6 py-5 dark:bg-zinc-950">
      <div className="mb-4 flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="mb-2 h-3 w-36 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          <Line className="w-10/12" />
        </div>
        <div className="grid w-36 grid-cols-2 gap-2">
          <Line className="w-full bg-sky-500" />
          <Line className="w-full bg-emerald-500" />
          <Line className="w-full bg-pink-400" />
          <Line className="w-full bg-zinc-300" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className={`h-2.5 rounded-full ${item === 0 ? 'w-28 bg-sky-500' : item === 2 ? 'w-24 bg-pink-500' : 'w-24 bg-zinc-800 dark:bg-zinc-100'}`} />
              <div className="h-2 w-14 rounded-full bg-zinc-300" />
            </div>
            <div className="space-y-1.5">
              <Line className="w-full" />
              <Line className="w-11/12" />
              <Line className="w-8/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroResumePreview({ variant }: { variant: string }) {
  if (variant === 'classic') return <ClassicPreview />;
  if (variant === 'minimal') return <MinimalPreview />;
  return <ModernPreview />;
}

export function HeroResumeShowcase() {
  return (
    <div className="relative mx-auto mt-14 h-[360px] w-full max-w-[520px] overflow-visible sm:h-[430px] lg:mx-0 lg:mt-0 lg:h-[560px] lg:max-w-none xl:h-[600px]">
      <CardSwap
        width="clamp(430px, 48vw, 760px)"
        height="clamp(310px, 38vw, 560px)"
        cardDistance={108}
        verticalDistance={62}
        delay={3800}
        skewAmount={4}
        easing="linear"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-6 lg:bottom-auto lg:left-12 lg:top-24 lg:translate-x-0 xl:left-16 2xl:left-20"
      >
        {cards.map(({ title, template, Icon, accent }) => (
          <Card key={template} aria-label={`${title}简历模板预览`}>
            <div className="flex h-full flex-col">
              <div className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white/88 px-4 text-sm font-semibold text-zinc-800 backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/88 dark:text-zinc-100">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${accent} text-white`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{title}</span>
              </div>
              <div className="min-h-0 flex-1 bg-white dark:bg-zinc-950">
                <HeroResumePreview variant={template} />
              </div>
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
