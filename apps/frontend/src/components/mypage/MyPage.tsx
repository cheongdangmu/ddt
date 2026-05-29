'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock3, Settings } from 'lucide-react';
import { MobileLayout } from '@/components/layout/mobileLayout';

type UserProfile = {
  userId: string;
  nickname: string;
  email: string;
  profileImage?: string;
};

type UserStats = {
  totalRoomCount: number;
  totalFocusMs: number;
  totalEscapeMs: number;
};

type HistoryItem = {
  roomId: string;
  roomTitle: string;
  profileImage?: string;
  totalEscapeMs: number;
  penaltyTier: number;
  memberCount: number;
  endedAt: string;
};

type ApiEnvelope<T> = {
  data?: T;
};

const emptyStats: UserStats = {
  totalRoomCount: 0,
  totalFocusMs: 0,
  totalEscapeMs: 0,
};

const getCookieToken = () => {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1];
};

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간 00분`;
  return `${minutes}분`;
};

const formatHistoryDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const getPenaltyTextColor = (milliseconds: number) => {
  return milliseconds === 0 ? 'text-[#10B981]' : 'text-[#FF606B]';
};

export const MyPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>(emptyStats);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = getCookieToken();
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const headers = { Authorization: `Bearer ${token}` };

    const loadMyPage = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [meResponse, statsResponse, historyResponse] = await Promise.all([
          fetch(`${apiUrl}/users/me`, { headers }),
          fetch(`${apiUrl}/users/me/stats`, { headers }),
          fetch(`${apiUrl}/users/me/history?limit=3`, { headers }),
        ]);

        if (!meResponse.ok || !statsResponse.ok || !historyResponse.ok) {
          throw new Error('마이페이지 정보를 불러오지 못했습니다.');
        }

        const meResult = (await meResponse.json()) as ApiEnvelope<UserProfile>;
        const statsResult = (await statsResponse.json()) as ApiEnvelope<UserStats>;
        const historyResult = (await historyResponse.json()) as ApiEnvelope<{
          sessions?: HistoryItem[];
        }>;

        setProfile(meResult.data ?? null);
        setStats(statsResult.data ?? emptyStats);
        setHistory(historyResult.data?.sessions?.slice(0, 3) ?? []);
      } catch {
        setErrorMessage('마이페이지 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadMyPage();
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        label: '참여한 방',
        value: `${stats.totalRoomCount}회`,
        className: 'col-span-1 row-span-2 bg-[#1D1C2C]',
        icon: true,
      },
      {
        label: '총 완료 시간',
        value: formatDuration(stats.totalFocusMs),
        className: 'bg-[#0B241A]',
      },
      {
        label: '총 이탈 시간',
        value: formatDuration(stats.totalEscapeMs),
        className: 'bg-[#2A0E16]',
      },
    ],
    [stats],
  );

  return (
    <MobileLayout
      header={
        <div className='flex w-full items-center justify-between'>
          <h1 className='text-[20px] font-medium tracking-normal text-white/90'>마이 페이지</h1>
          <button
            type='button'
            aria-label='설정'
            className='flex size-8 items-center justify-center rounded-full text-[#8A8A99] transition hover:bg-white/5 hover:text-white'
          >
            <Settings size={24} strokeWidth={1.8} />
          </button>
        </div>
      }
    >
      <section className='mb-5 flex items-center gap-4 pt-2'>
        <div className='size-[62px] shrink-0 rounded-full border-2 border-[#914CFF] bg-[#201E34]' />
        <div className='min-w-0'>
          {profile ? (
            <>
              <p className='truncate text-[18px] font-bold leading-6 text-white'>
                {profile.nickname}
              </p>
              <p className='truncate text-[14px] leading-5 text-[#81808D]'>{profile.email}</p>
            </>
          ) : (
            <>
              <div className='mb-2 h-5 w-20 rounded bg-white/10' />
              <div className='h-4 w-36 rounded bg-white/10' />
            </>
          )}
        </div>
      </section>

      <Link
        href='/room'
        className='mb-4 flex h-[51px] w-full items-center justify-center rounded-[14px] border border-[#914CFF] bg-[#242136] text-[15px] font-bold text-white/90 transition hover:bg-[#2A2640]'
      >
        새로운 방 만들기
      </Link>

      <section className='mb-12 grid h-[140px] grid-cols-2 grid-rows-2 gap-2'>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-[12px] px-3 py-4 ${card.className}`}
          >
            <p className='text-center text-[11px] font-medium text-[#767481]'>{card.label}</p>
            <p className='mt-1 text-center text-[18px] font-extrabold leading-7 text-white/90'>
              {card.value}
            </p>
            {card.icon ? (
              <Clock3
                className='absolute -bottom-[28px] left-1/2 size-[78px] -translate-x-1/2 text-white/10'
                strokeWidth={2.6}
              />
            ) : null}
          </div>
        ))}
      </section>

      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-[14px] font-medium text-[#898793]'>최근 참여 기록</h2>
          <Link
            href='/mypage'
            className='flex items-center gap-1 text-[13px] font-medium text-[#898793] transition hover:text-white'
          >
            전체 보기
            <ChevronRight size={14} strokeWidth={1.8} />
          </Link>
        </div>

        <div className='space-y-3'>
          {isLoading ? (
            <div className='rounded-[12px] bg-[#1D1C31] px-[14px] py-6 text-center text-[13px] text-[#898793]'>
              불러오는 중...
            </div>
          ) : errorMessage ? (
            <div className='rounded-[12px] bg-[#1D1C31] px-[14px] py-6 text-center text-[13px] text-[#FF606B]'>
              {errorMessage}
            </div>
          ) : history.length === 0 ? (
            <div className='rounded-[12px] bg-[#1D1C31] px-[14px] py-6 text-center text-[13px] text-[#898793]'>
              최근 참여 기록이 없습니다.
            </div>
          ) : (
            history.map((item) => (
              <Link
                key={item.roomId}
                href={`/result/${item.roomId}`}
                className='flex min-h-[95px] items-center justify-between rounded-[12px] bg-[#1D1C31] px-[14px] py-4 transition hover:bg-[#24223A]'
              >
                <div className='min-w-0'>
                  <p className='mb-1 text-[12px] font-medium text-[#747281]'>
                    {formatHistoryDate(item.endedAt)}
                  </p>
                  <p className='mb-2 truncate text-[17px] font-extrabold leading-6 text-white'>
                    {item.roomTitle}
                  </p>
                  <p className='text-[12px] font-medium text-[#A5A3AF]'>
                    참여 {item.memberCount}명
                    <span className={`ml-2 ${getPenaltyTextColor(item.totalEscapeMs)}`}>
                      내 이탈 {formatDuration(item.totalEscapeMs)}
                    </span>
                  </p>
                </div>
                <ChevronRight
                  className='ml-3 shrink-0 text-[#8A8896]'
                  size={17}
                  strokeWidth={1.8}
                />
              </Link>
            ))
          )}
        </div>
      </section>
    </MobileLayout>
  );
};
