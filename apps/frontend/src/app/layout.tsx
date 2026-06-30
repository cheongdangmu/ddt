import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: '감옥 - 디지털 디톡스 스페이스',
  description:
    '딴짓하는 순간, 당신은 실패입니다. 가장 치열한 집중을 위한 효율적인 디지털 디톡스 타이머.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '감옥',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='ko'
      className={`${notoSansKR.variable} h-full antialiased dark`}
    >
      <body
        /* h-full로 통일하여 정확한 100% 높이를 잡고 중복 배경색 클래스를 제거했습니다. */
        className='h-full w-full overflow-hidden flex justify-center sm:bg-zinc-500'
        style={{
          backgroundColor: '#09090b',
          backgroundImage: "url('/images/fullBackground.webp')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <Providers>
          {/* [스마트폰 바깥쪽 케이스 틀] */}
          {/* h-screen 대신 h-full을 사용하여 body 구조와 싱크를 맞췄습니다. */}
          <div className='relative flex h-full w-full flex-col bg-background box-border sm:mx-auto sm:w-[min(92vw,420px)] sm:rounded-[44px] sm:border sm:border-white/80 sm:bg-zinc-950 sm:p-2 sm:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_24px_70px_rgba(0,0,0,0.65)] sm:ring-1 sm:ring-white/40'>
            
            {/* [스마트폰 안쪽 액정 화면] */}
            {/* 굳이 필요 없는 relative와 w-full 중복을 다듬어 가독성을 높였습니다. */}
            <div className='flex flex-1 min-h-0 flex-col overflow-hidden rounded-[36px] bg-background sm:border sm:border-white/50 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'>
              
              {/* [실제 내부 스크롤 콘텐츠 영역] */}
              <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden'>
                {children}
              </div>

            </div>

          </div>
        </Providers>
      </body>
    </html>
  );
}
