'use client';

import { createContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface RoomContextValue {
  code: string;
  hostId: string;
  myUserId: string;
  myNickname: string;
  isHost: boolean;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({
  code,
  children,
}: {
  code: string;
  children: ReactNode;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['room', code],
    queryFn: async () => {},
  });
}
