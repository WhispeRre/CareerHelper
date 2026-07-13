'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mic } from 'lucide-react';

export function MockInterviewSection() {
  const t = useTranslations('landing.features');
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="mock-interview" className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 sm:py-32 lg:px-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            {t('mockInterview.title')}
          </h2>
          <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400 sm:text-lg">
            {t('mockInterview.description')}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
          <div className="grid min-h-[420px] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-zinc-100 p-6 sm:p-10 lg:border-b-0 lg:border-r dark:border-zinc-800">
              <div className="flex h-full flex-col justify-center gap-4">
                <div
                  className="flex items-center gap-3 rounded-2xl border border-brand-muted bg-brand-muted/50 p-4 dark:border-brand-muted dark:bg-brand-muted"
                  style={isVisible ? { animation: 'demo-slide-up 0.4s ease-out both' } : { opacity: 0 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-lg font-bold text-white">
                    李
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">李雯 · HR总监</div>
                    <div className="mt-1 text-xs text-zinc-400">温和友善，关注动机与匹配度</div>
                  </div>
                </div>

                <div style={isVisible ? { animation: 'demo-slide-up 0.4s ease-out 0.5s both' } : { opacity: 0 }}>
                  <div className="max-w-[85%] rounded-r-2xl border-l-[3px] border-brand bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm shadow-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:shadow-black/20">
                    能分享一下是什么契机让你决定从前端转向 AI 方向？
                  </div>
                </div>

                <div className="flex justify-end" style={isVisible ? { animation: 'demo-slide-up 0.4s ease-out 1s both' } : { opacity: 0 }}>
                  <div className="max-w-[70%] rounded-2xl rounded-tr-none bg-gradient-to-br from-zinc-900 to-zinc-800 px-4 py-3 text-sm text-white shadow-lg dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-950">
                    看到 AI 在提效方面的巨大潜力...
                  </div>
                </div>

                <div className="flex items-center gap-2" style={isVisible ? { animation: 'demo-slide-up 0.4s ease-out 1.5s both' } : { opacity: 0 }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-sm font-bold text-white">
                    李
                  </div>
                  <div className="flex items-end gap-[3px]">
                    {[0, 0.15, 0.3, 0.45, 0.6].map((delay, index) => (
                      <span
                        key={index}
                        className="inline-block w-1 rounded-sm bg-brand"
                        style={{
                          height: '14px',
                          animation: isVisible ? `thinkingWave 1.2s ease-in-out ${1.9 + delay}s infinite` : 'none',
                          opacity: index % 2 === 0 ? 1 : 0.5,
                        }}
                      />
                    ))}
                    <span className="ml-2 text-sm text-zinc-400">思考中...</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center p-8 sm:p-12">
              <div>
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-muted text-brand dark:bg-brand-muted">
                  <Mic className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {t('mockInterview.title')}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-400 sm:text-lg">
                  {t('mockInterview.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
