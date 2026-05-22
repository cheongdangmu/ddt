'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogTitle,DialogClose } from '@/components/ui/dialog';
import { ChevronRight, X } from 'lucide-react';
import Image from 'next/image';

const TermsPage = () => {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [isOver14, setIsOver14] = useState(false);
  const allChecked = terms && privacy && isOver14;

  const handleAllCheck = () => {
    const newState = !allChecked;
    setTerms(newState);
    setPrivacy(newState);
    setIsOver14(newState);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    // 배경 이미지를 그대로 노출하고 가독성을 위해 흰색 테두리만 유지
    <div
      className='w-full p-6 border border-white/20 bg-cover bg-center'
      style={{ backgroundImage: "url('/images/bgMain.webp')" }}
    >
      <div className='w-full flex items-center justify-between mb-10'>
        <div className='w-6' />
        <DialogTitle className='flex-1 text-center font-bold text-white'>약관 동의</DialogTitle>
        <DialogClose asChild>
          <button className='text-white p-2 hover:bg-white/20 rounded-full transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </DialogClose>
      </div>

      <div className='text-center mb-10'>
        <div className='flex justify-center mb-10'>
          <Image
            src='/images/logo.webp'
            alt='감옥 로고'
            width={120}
            height={48}
          />
        </div>
        <p className='text-white'>
          서비스 이용을 위해
          <br />
          약관에 동의해주세요.
        </p>
      </div>

      <div className='flex flex-col gap-3 w-full mb-10'>
        {/* 내부 요소 배경을 완전히 제거하여 배경 이미지가 100% 보이게 설정 */}
        <div className='flex items-center p-4 border border-white/20'>
          <Checkbox
            id='all'
            checked={allChecked}
            onCheckedChange={handleAllCheck}
          />
          <label
            htmlFor='all'
            className='ml-3 font-semibold cursor-pointer text-white'
          >
            약관 전체동의
          </label>
        </div>

        {[
          {
            id: 'terms',
            label: '서비스 이용약관',
            state: terms,
            setter: setTerms,
          },
          {
            id: 'privacy',
            label: '개인정보 수집 및 이용동의',
            state: privacy,
            setter: setPrivacy,
          },
          {
            id: 'isOver14',
            label: '만 14세 이상 확인',
            state: isOver14,
            setter: setIsOver14,
          },
        ].map((item) => (
          <div
            key={item.id}
            className='flex items-center justify-between p-4 border border-white/20'
          >
            <div className='flex items-center'>
              <Checkbox
                id={item.id}
                checked={item.state}
                onCheckedChange={(c) => item.setter(!!c)}
              />
              <label
                htmlFor={item.id}
                className='ml-3 cursor-pointer text-white'
              >
                {item.label} <span className='text-red-400'>(필수)</span>
              </label>
            </div>
            <ChevronRight className='text-white' />
          </div>
        ))}
      </div>

      <Button
        className='w-full h-14 bg-[#5F63F2] hover:bg-[#5F63F2]/90 text-lg font-semibold'
        disabled={!allChecked}
        onClick={handleGoogleLogin}
      >
        <span className='mr-2'>G</span> Google로 계속하기
      </Button>

      <p className='text-center text-xs text-white mt-6'>
        🔒 안전한 보안 환경에서 로그인 진행 중
      </p>
    </div>
  );
};

export default TermsPage;
