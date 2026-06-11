'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const PenaltyRoulette = dynamic(
  () => import('@/components/ui/custom-roulette'),
  {
    ssr: false,
    loading: () => (
      <div className='mx-auto aspect-square w-full max-w-[320px] rounded-full border-2 border-[var(--roulette-panel-border)] bg-[var(--roulette-wheel-center)]' />
    ),
  },
);

// 프리뷰/휠 동작 확인용 목 벌칙 (길이 다양 — 티커·라벨 truncation 동시 확인)
const MOCK_ITEMS = [
  '딱밤 한 대',
  '아메리카노 사오기',
  '단체 사진 프로필 1주일',
  '노래방 18번 부르기',
  '엉덩이로 이름 쓰기',
  '점심 메뉴 결정권 박탈',
  '주말 출근',
  '애교 3종 세트',
];

export default function DevRoulettePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);

  const handleStart = () => {
    if (isSpinning) return;

    const nextIndex = Math.floor(Math.random() * MOCK_ITEMS.length);
    setTargetIndex(nextIndex);
    setIsSpinning(true);
  };

  const handleStop = () => {
    setIsSpinning(false);
  };

  return (
    <div className='mx-auto flex min-h-dvh w-full max-w-[420px] flex-col gap-6 px-4 py-8 text-foreground'>
      <header className='text-center'>
        <h1 className='text-lg font-bold'>룰렛 프리뷰 데모</h1>
        <p className='mt-1 text-xs text-muted-foreground'>
          백엔드 없이 동적 프리뷰/휠 연출만 확인하는 개발용 페이지
        </p>
      </header>

      <div className='flex w-full flex-col items-center rounded-2xl border border-[var(--roulette-card-border)] bg-[var(--roulette-card)] px-4 py-6'>
        <h2 className='mb-6 text-lg font-bold'>오늘의 벌칙 뽑기</h2>
        <PenaltyRoulette
          mustStartSpinning={isSpinning}
          targetIndex={targetIndex}
          onStopSpinning={handleStop}
          items={MOCK_ITEMS}
        />
      </div>

      <Button
        variant='default'
        size='main'
        className='w-full rounded-[14px] font-bold'
        onClick={handleStart}
        disabled={isSpinning}
      >
        {isSpinning ? '룰렛 돌리는 중...' : '룰렛 돌리기'}
      </Button>
    </div>
  );
}
