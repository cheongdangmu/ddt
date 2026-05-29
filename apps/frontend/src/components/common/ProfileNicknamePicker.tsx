'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PROFILE_IMAGE_OPTIONS } from '@/lib/profileImage';

interface ProfileNicknamePickerProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  selectedProfile: number;
  onSelectProfile: (index: number) => void;
  maxNicknameLength?: number;
  nicknamePlaceholder?: string;
  profileDescription?: string;
}

export function ProfileNicknamePicker({
  nickname,
  onNicknameChange,
  selectedProfile,
  onSelectProfile,
  maxNicknameLength = 10,
  nicknamePlaceholder = '닉네임을 입력해주세요',
  profileDescription,
}: ProfileNicknamePickerProps) {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <Label className='text-[15px] font-bold text-white/85'>내 닉네임</Label>
        <Input
          type='text'
          placeholder={nicknamePlaceholder}
          maxLength={maxNicknameLength}
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          className='h-[52px] rounded-[16px] border-white/[0.12] bg-[#1A1A2E] px-4 text-sm text-white placeholder:text-white/30 focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30'
        />
        <span className='text-xs text-[#6B7280] text-right'>
          {nickname.length}/{maxNicknameLength}
        </span>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <Label className='text-[15px] font-bold text-white/85'>프로필 이미지</Label>
          {profileDescription ? (
            <span className='text-[12px] text-[#A3A1B3]'>{profileDescription}</span>
          ) : null}
        </div>
        <div className='grid grid-cols-5 gap-3'>
          {PROFILE_IMAGE_OPTIONS.map((profileImage, index) => (
            <button
              key={profileImage.key}
              type='button'
              onClick={() => onSelectProfile(index)}
              className='relative aspect-square rounded-full bg-[#1A1A2E] border-2 transition-all'
              style={{
                borderColor: selectedProfile === index ? '#8B5CF6' : 'transparent',
              }}
            >
              <div className='relative h-full w-full overflow-hidden rounded-full'>
                <Image
                  src={profileImage.src}
                  alt={profileImage.label}
                  fill
                  className='object-cover'
                />
              </div>
              {selectedProfile === index ? (
                <span className='absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]'>
                  <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
                    <path d='M1 4L3.5 6.5L9 1' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
