'use client';

export default function JoinedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {}

function SocketWrapper({ children }: { children: React.ReactNode }) {}
