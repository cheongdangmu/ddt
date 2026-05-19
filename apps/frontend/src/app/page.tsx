'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState<string>('서버 연결 대기 중...');

  useEffect(() => {
    // 1. 백엔드(8080 포트)로 소켓 연결 시도
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    // 2. 서버에서 'welcome' 메시지가 오면 화면 업데이트
    newSocket.on('welcome', (data) => {
      console.log(data);
      setMessage(data.message);
    });

    // 3. 서버에서 'pong' 답장이 오면 알림창 띄우기
    newSocket.on('pong', (data) => {
      alert(data);
    });

    // 컴포넌트가 꺼질 때 소켓 닫기
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendPing = () => {
    if (socket) {
      // 서버로 'ping' 이벤트 쏘기
      socket.emit('ping', '프론트가 찌릅니다!'); 
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-900 text-white">
      <h1 className="text-4xl font-bold mb-4">DDT V2 실시간 소켓 테스트</h1>
      <p className="text-xl mb-8 text-green-400">{message}</p>
      
      <button 
        onClick={sendPing}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
      >
        서버 찌르기 (Ping 쏘기)
      </button>
    </main>
  );
}