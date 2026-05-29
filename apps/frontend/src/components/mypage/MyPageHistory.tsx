'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layout/mobileLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { HeaderTitle } from '../layout/HeaderTitle';
import { BackButton } from '../layout/BackButton';
import { MyPageHistoryList, HistoryItem } from '@/components/mypage/MyPageHistoryList';
import { getUsers } from '@/api/generated/users-사용자/users-사용자';

type ApiEnvelope<T> = {
  data?: T;
};

const DUMMY_HISTORY: HistoryItem[] = [
  {
    roomId: 'dummy-room-1',
    roomTitle: '모바일 스터디 뽀모도로',
    profileImage: 'char_03',
    totalEscapeMs: 0,
    penaltyTier: 1,
    memberCount: 4,
    endedAt: '2026-05-28T21:30:00.000Z',
  },
  {
    roomId: 'dummy-room-2',
    roomTitle: '저녁 집중 세션',
    profileImage: 'char_06',
    totalEscapeMs: 60000,
    penaltyTier: 2,
    memberCount: 3,
    endedAt: '2026-05-27T20:00:00.000Z',
  },
  {
    roomId: 'dummy-room-3',
    roomTitle: '오전 목표 달성 모임',
    profileImage: 'char_01',
    totalEscapeMs: 180000,
    penaltyTier: 3,
    memberCount: 5,
    endedAt: '2026-05-26T09:15:00.000Z',
  },
];

const getCookieToken = () => {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1];
};

export function MyPageHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(DUMMY_HISTORY);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = getCookieToken();
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const axiosInstance = axios.create({ baseURL: apiUrl });
    const usersApi = getUsers(axiosInstance);

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        const response = await usersApi.usersControllerGetMyHistory(
          { limit: 100 },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const result = response.data as ApiEnvelope<{
          total: number;
          page: number;
          sessions?: HistoryItem[];
        }>;

        const sessions = result.data?.sessions;
        if (!sessions || sessions.length === 0) {
          setHistory(DUMMY_HISTORY);
          setErrorMessage('참여 내역이 없어 더미 데이터를 표시합니다.');
        } else {
          setHistory(sessions);
          setErrorMessage('');
        }
      } catch {
        setHistory(DUMMY_HISTORY);
        setErrorMessage('참여 기록을 불러오지 못했습니다. 더미 데이터를 표시합니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <RequireAuth>
      <MobileLayout
        header={
          <>
            <BackButton />
            <HeaderTitle>
                내 참여 기록
            </HeaderTitle>
          </>           
        }
      >
        <MyPageHistoryList
          history={history}
          isLoading={isLoading}
          errorMessage={errorMessage}
          emptyMessage='참여 기록이 없습니다.'
          loadingMessage='불러오는 중...'
          chevronDirection='left'
        />
      </MobileLayout>
    </RequireAuth>
  );
}
