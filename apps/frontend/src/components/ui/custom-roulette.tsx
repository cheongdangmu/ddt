'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Wheel } from 'react-custom-roulette';

interface RouletteData {
  option: string;
  style?: { backgroundColor?: string; textColor?: string };
}

interface PenaltyRouletteProps {
  mustStartSpinning: boolean;
  targetIndex: number;
  onStopSpinning: () => void;
  items?: string[];
  // 휠 회전 시간(react-custom-roulette 상대값, 낮을수록 빠름). 기본 0.8
  spinDuration?: number;
  // 직접/자동 스핀 없이 '결과 바로보기'로 완료된 경우 프리뷰 기본 문구를 완료 문구로 대체
  isDrawDone?: boolean;
}

// 벌칙 개수 구간별 휠 라벨 최대 글자 수 (개수가 많을수록 짧게 잘라 휠에 맞춤)
const LABEL_MAX_LENGTH_TIERS = [
  { minCount: 49, maxLen: 1 },
  { minCount: 48, maxLen: 2 },
  { minCount: 36, maxLen: 4 },
  { minCount: 24, maxLen: 6 },
  { minCount: 0, maxLen: 8 },
] as const;

const DEFAULT_LABEL_MAX_LENGTH = 8;

const getLabelMaxLength = (count: number) =>
  LABEL_MAX_LENGTH_TIERS.find((tier) => count >= tier.minCount)?.maxLen ??
  DEFAULT_LABEL_MAX_LENGTH;

const getCssVariable = (name: string) => {
  if (typeof window === 'undefined') return '';

  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

// ── 동적 프리뷰 ──────────────────────────────────────────────
// react-custom-roulette 내부 3단계 타이밍(ms) — 휠 회전 속도 곡선과 일치시키기 위함
const START_SPINNING_TIME = 2600; // 가속(ease-in)
const CONTINUE_SPINNING_TIME = 750; // 등속(linear)
const STOP_SPINNING_TIME = 8000; // 감속 착지(ease-out)
// Phase 3에서 프리뷰가 훑고 지나갈 가상 바퀴 수 (휠의 ~1440° 대응)
const PREVIEW_FULL_LOOPS = 4;

// CSS cubic-bezier(x1,y1,x2,y2) 평가기 (시간비 x → 이징값 y). 휠 키프레임과 동일 곡선 재현
const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solveT = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xErr = sampleX(t) - x;
      if (Math.abs(xErr) < 1e-4) return t;
      const dx = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      t -= xErr / dx;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const xVal = sampleX(t);
      if (Math.abs(xVal - x) < 1e-4) break;
      if (xVal < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveT(x));
  };
};

// 휠 키프레임과 동일한 이징 (styles.js 기준)
const EASE_START = cubicBezier(0.71, -0.29, 0.96, 0.9);
const EASE_STOP = cubicBezier(0, 0, 0.35, 1.02);

interface RoulettePreviewProps {
  items: string[];
  isSpinning: boolean;
  targetIndex: number;
  spinDuration: number;
  isDrawDone: boolean;
}

const RoulettePreview = React.memo(function RoulettePreview({
  items,
  isSpinning,
  targetIndex,
  spinDuration,
  isDrawDone,
}: RoulettePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const activeIndexRef = useRef(0);
  const pendingTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // 매 프레임 effect 재실행 없이 직전 위치를 읽기 위한 ref 동기화
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (!isSpinning || items.length === 0 || targetIndex < 0) return;

    setHasSpun(true);
    const count = items.length;
    const startIndex = activeIndexRef.current % count;
    const target = targetIndex % count;
    pendingTargetRef.current = target;
    const offset = (target - startIndex + count) % count;
    const d = Math.max(0.01, spinDuration);
    const t1 = START_SPINNING_TIME * d; // 가속 종료 시점
    const t2 = CONTINUE_SPINNING_TIME * d; // 등속 구간 길이
    const t3 = STOP_SPINNING_TIME * d; // 감속 구간 길이
    const total = t1 + t2 + t3;
    // Phase1: +1바퀴, Phase2: +1바퀴, Phase3: 가상 바퀴 + 목표 보정
    const phase3Ticks = PREVIEW_FULL_LOOPS * count + offset;

    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      let ticks: number;
      if (elapsed < t1) {
        // 가속: 0 → 1바퀴
        ticks = EASE_START(elapsed / t1) * count;
      } else if (elapsed < t1 + t2) {
        // 등속: 1 → 2바퀴
        ticks = count + ((elapsed - t1) / t2) * count;
      } else if (elapsed < total) {
        // 감속 착지: 2바퀴 → 최종(목표 안착)
        ticks = 2 * count + EASE_STOP((elapsed - t1 - t2) / t3) * phase3Ticks;
      } else {
        ticks = 2 * count + phase3Ticks; // 정확한 최종값
      }
      const nextIndex =
        (((startIndex + Math.round(ticks)) % count) + count) % count;
      setActiveIndex(nextIndex);
      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isSpinning, items.length, targetIndex, spinDuration]);

  // 스핀 종료 시 마지막 당첨 인덱스로 확정(고정) — raf 타이밍 오차 보정
  useEffect(() => {
    if (!isSpinning && hasSpun) {
      setActiveIndex(pendingTargetRef.current);
    }
  }, [isSpinning, hasSpun]);

  const hasItems = items.length > 0;
  // 스핀 시작 이후 고정 노출할 마지막 당첨 벌칙명
  const pinnedLabel = hasItems ? (items[activeIndex] ?? items[0]) : '';

  /* 대기상태(최초 진입~첫 스핀 이전) 전체 벌칙 가로 티커 — 추후 사용 위해 보존
  const tickerItems = [...items, ...items];
  const marqueeDuration = Math.max(8, items.length * 2.2);
  const waitingTicker = (
    <div
      className='flex w-max shrink-0 whitespace-nowrap motion-reduce:[animation:none]'
      style={{ animation: `marqueeScroll ${marqueeDuration}s linear infinite` }}
    >
      {tickerItems.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className='mx-3 text-sm text-muted-foreground'
        >
          {item}
        </span>
      ))}
    </div>
  );
  */

  return (
    <div className='mb-5 flex h-10 w-full min-w-0 items-center overflow-hidden rounded-[14px] border border-[var(--roulette-panel-border)] bg-[var(--roulette-panel)] px-3'>
      {!hasSpun ? (
        <p className='w-full text-center text-xs text-muted-foreground'>
          {isDrawDone ? '벌칙 뽑기 완료' : '결과 대기 중…'}
        </p>
      ) : (
        <p className='w-full truncate text-center text-base font-bold text-foreground'>
          {pinnedLabel}
        </p>
      )}
    </div>
  );
});

export const PenaltyRoulette = React.memo(function PenaltyRoulette({
  mustStartSpinning,
  targetIndex,
  onStopSpinning,
  items = [],
  spinDuration = 0.3,
  isDrawDone = false,
}: PenaltyRouletteProps) {
  const displayItems = useMemo(
    () => (items.length > 0 ? items : ['준비중']),
    [items],
  );
  const safeTargetIndex =
    targetIndex >= 0 && targetIndex < displayItems.length ? targetIndex : 0;

  const rouletteTheme = useMemo(
    () => ({
      even: getCssVariable('--roulette-wheel-even'),
      odd: getCssVariable('--roulette-wheel-odd'),
      center: getCssVariable('--roulette-wheel-center'),
      border: getCssVariable('--roulette-panel-border'),
      foreground: getCssVariable('--foreground'),
      font: getCssVariable('--font-noto-sans-kr'),
    }),
    [],
  );

  const rouletteData: RouletteData[] = useMemo(() => {
    const maxLen = getLabelMaxLength(displayItems.length);
    return displayItems.map((item, index) => ({
      option: item.length > maxLen ? item.slice(0, maxLen - 1) + '…' : item,
      style: {
        backgroundColor:
          index % 2 === 0 ? rouletteTheme.even : rouletteTheme.odd,
        textColor: rouletteTheme.foreground,
      },
    }));
  }, [displayItems, rouletteTheme]);

  return (
    <div className='mx-auto flex w-full max-w-[320px] flex-col items-center'>
      <RoulettePreview
        items={items}
        isSpinning={mustStartSpinning}
        targetIndex={safeTargetIndex}
        spinDuration={spinDuration}
        isDrawDone={isDrawDone}
      />
      <div className='relative flex aspect-square w-full rotate-[-43deg] items-center justify-center overflow-hidden rounded-full contain-layout [&>div:first-child]:!h-full [&>div:first-child]:!max-h-full [&>div:first-child]:!max-w-full [&>div:first-child]:!overflow-hidden [&>div:first-child]:!w-full [&_canvas]:!h-full [&_canvas]:!w-full'>
        <Wheel
          mustStartSpinning={mustStartSpinning}
          prizeNumber={safeTargetIndex}
          data={rouletteData}
          onStopSpinning={onStopSpinning}
          spinDuration={spinDuration}
          outerBorderColor={rouletteTheme.border}
          outerBorderWidth={4}
          innerRadius={20}
          innerBorderColor={rouletteTheme.border}
          innerBorderWidth={2}
          radiusLineColor={rouletteTheme.border}
          radiusLineWidth={1}
          fontSize={18}
          textDistance={65}
          fontFamily={rouletteTheme.font}
        />
        <div className='pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 rotate-43 items-center justify-center rounded-full border border-[var(--roulette-panel-border)] bg-[var(--roulette-wheel-center)] text-[10px] font-bold text-foreground shadow-md'>
          감옥
        </div>
      </div>
    </div>
  );
});

export default PenaltyRoulette;
