'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  container?: string | Element | null;
  blur?: boolean;
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

const getSeconds = (value: number) => (value > 10 ? value / 1000 : value);

export default function FadeContent({
  children,
  container,
  blur = false,
  duration = 1000,
  ease = 'power2.out',
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power2.in',
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}: FadeContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let scrollerTarget: string | Element | Window | null | undefined = container;
    if (!scrollerTarget) {
      scrollerTarget = document.getElementById('snap-main-container') || window;
    } else if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const startPct = (1 - threshold) * 100;

    gsap.set(el, {
      autoAlpha: initialOpacity,
      filter: blur ? 'blur(10px)' : 'blur(0px)',
      willChange: 'opacity, filter, transform',
    });

    const timeline = gsap.timeline({
      paused: true,
      delay: getSeconds(delay),
      onComplete: () => {
        onComplete?.();

        if (disappearAfter > 0) {
          gsap.to(el, {
            autoAlpha: initialOpacity,
            filter: blur ? 'blur(10px)' : 'blur(0px)',
            delay: getSeconds(disappearAfter),
            duration: getSeconds(disappearDuration),
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          });
        }
      },
    });

    timeline.to(el, {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: getSeconds(duration),
      ease,
    });

    const scrollTrigger = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => timeline.play(),
    });

    return () => {
      scrollTrigger.kill();
      timeline.kill();
      gsap.killTweensOf(el);
    };
  }, [
    blur,
    container,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    duration,
    ease,
    initialOpacity,
    onComplete,
    onDisappearanceComplete,
    threshold,
  ]);

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
}
