'use client';

import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import gsap from 'gsap';

import styles from './card-swap.module.css';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  customClass?: string;
};

type CardSwapProps = {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type CardSlot = {
  x: number;
  y: number;
  z: number;
  zIndex: number;
};

type CardElement = ReactElement<
  CardProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
>;

function createCardRefs(length: number): RefObject<HTMLDivElement | null>[] {
  return Array.from({ length }, () => createRef<HTMLDivElement>());
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { customClass, className, ...rest },
  ref,
) {
  return <div ref={ref} {...rest} className={[styles.card, customClass, className].filter(Boolean).join(' ')} />;
});

function makeSlot(index: number, distX: number, distY: number, total: number): CardSlot {
  return {
    x: index * distX,
    y: -index * distY,
    z: 0,
    zIndex: total - index,
  };
}

function placeNow(element: HTMLDivElement | null, slot: CardSlot, skew: number) {
  if (!element) return;

  gsap.set(element, {
    x: slot.x,
    y: slot.y,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });
}

function getInitialCardStyle(slot: CardSlot, skew: number): CSSProperties {
  return {
    transform: `translate3d(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px), 0) skewY(${skew}deg)`,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
  };
}

export default function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children,
  className,
  style,
}: CardSwapProps) {
  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(() => createCardRefs(childArr.length), [childArr.length]);

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    refs.forEach((ref, i) => {
      placeNow(ref.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
    });

    if (prefersReducedMotion || total < 2) return;

    const config =
      easing === 'elastic'
        ? {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: 'power1.inOut',
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2,
          };

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front]?.current;
      if (!elFront) return;

      const timeline = gsap.timeline();
      timelineRef.current = timeline;

      timeline.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease,
      });

      timeline.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const element = refs[idx]?.current;
        if (!element) return;

        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        timeline.set(element, { zIndex: slot.zIndex }, 'promote');
        timeline.to(
          element,
          {
            x: slot.x,
            y: slot.y,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`,
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      timeline.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      timeline.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        'return',
      );
      timeline.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          duration: config.durReturn,
          ease: config.ease,
        },
        'return',
      );

      timeline.call(() => {
        order.current = [...rest, front];
      });
    };

    intervalRef.current = window.setInterval(swap, delay);

    const node = containerRef.current;
    const pause = () => {
      timelineRef.current?.pause();
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const resume = () => {
      timelineRef.current?.play();
      if (intervalRef.current === null) {
        intervalRef.current = window.setInterval(swap, delay);
      }
    };

    if (pauseOnHover && node) {
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
    }

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (pauseOnHover && node) {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
      }
    };
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs]);

  const rendered = childArr.map((child, i) => {
    if (!isValidElement<CardProps>(child)) return child;

    const cardChild = child as CardElement;
    const slot = makeSlot(i, cardDistance, verticalDistance, childArr.length);
    return cloneElement(cardChild, {
      key: i,
      ref: refs[i],
      style: { width, height, ...getInitialCardStyle(slot, skewAmount), ...cardChild.props.style },
      onClick: (event: MouseEvent<HTMLDivElement>) => {
        cardChild.props.onClick?.(event);
        onCardClick?.(i);
      },
    });
  });

  return (
    <div
      ref={containerRef}
      className={[styles.container, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
    >
      {rendered}
    </div>
  );
}
