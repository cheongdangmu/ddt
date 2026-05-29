'use client';

import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/layout/BackButton';
import { HeaderTitle } from '@/components/layout/HeaderTitle';
import { MobileLayout } from '@/components/layout/mobileLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MyPageDeleteButton } from '@/components/mypage/MyPageDeleteButton';
import { useAuthStore } from '@/store/useAuthStore';
import { getUsers } from '@/api/generated/users-사용자/users-사용자';
import type { UpdateUserDto } from '@/api/generated/models/updateUserDto';
import { PROFILE_IMAGE_OPTIONS, getProfileImageSrc } from '@/lib/profileImage';
import { Check } from 'lucide-react';

type UserProfile = {
  userId: string;
  nickname: string;
  email: string;
  profileImage?: string;
};

type ApiEnvelope<T> = {
  data?: T;
};

const getCookieToken = () => {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1];
};

export function MyPageEdit() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedProfileKey = PROFILE_IMAGE_OPTIONS[selectedProfile]?.key;
  const profileImageSrc = getProfileImageSrc(PROFILE_IMAGE_OPTIONS[selectedProfile]?.key);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const axiosInstance = axios.create({ baseURL: apiUrl });
    const usersApi = getUsers(axiosInstance);

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      const token = getCookieToken();
      if (!token) {
        setError('로그인 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const response = await usersApi.usersControllerGetMe({ headers });
        const result = response.data as ApiEnvelope<UserProfile>;
        const data = result.data;

        if (!data) {
          throw new Error('프로필을 불러오지 못했습니다.');
        }

        setNickname(data.nickname ?? '');

        const index = PROFILE_IMAGE_OPTIONS.findIndex((item) => item.key === data.profileImage);
        setSelectedProfile(index >= 0 ? index : 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const isValid = nickname.trim().length > 0 && nickname.trim().length <= 10;

  const handleSave = async () => {
    if (!isValid) return;

    const token = getCookieToken();
    if (!token) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const axiosInstance = axios.create({ baseURL: apiUrl });
    const usersApi = getUsers(axiosInstance);

    try {
      const updateUserDto: UpdateUserDto = {
        nickname: nickname.trim(),
        profileImage: selectedProfileKey,
      };

      await usersApi.usersControllerUpdateMe(updateUserDto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('프로필이 저장되었습니다.');
      setTimeout(() => {
        router.push('/mypage');
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const token = getCookieToken();
    if (!token) {
      setError('로그인 정보가 없습니다.');
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const axiosInstance = axios.create({ baseURL: apiUrl });
    const usersApi = getUsers(axiosInstance);

    try {
      await usersApi.usersControllerDeleteMe({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logout();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <RequireAuth>
      <MobileLayout
        header={
        <div className='flex w-full items-center justify-between gap-3'>
          <BackButton />
          <HeaderTitle>프로필 수정</HeaderTitle>
          <MyPageDeleteButton
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            isDeleting={isDeleting}
          />
        </div>
      }
        bottomButton={
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving || isLoading}
            className='w-full rounded-[24px] text-base font-bold'
            size='main'
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>
        }
      >
        <div className='space-y-6 pb-4'>
          <div className='rounded-[22px] border border-white/10 bg-[#1B1F2F] p-5 text-white'>
            <div className='mb-5 flex items-center justify-between'>
              <div>
                <p className='text-[14px] font-semibold'>프로필 이미지</p>
                <p className='mt-1 text-[12px] text-[#A3A1B3]'>원하는 이미지를 선택해주세요.</p>
              </div>
              <div className='relative h-16 w-16 overflow-hidden rounded-full border border-[#6D5AF5] bg-[#2F2A53]'>
                {profileImageSrc ? (
                  <Image
                    src={profileImageSrc}
                    alt='선택된 프로필'
                    fill
                    className='object-cover'
                  />
                ) : null}
                <span className='pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#8B5CF6]/50' />
              </div>
            </div>

            <div className='grid grid-cols-5 gap-3'>
              {PROFILE_IMAGE_OPTIONS.map((image, index) => {
                const isSelected = selectedProfile === index;
                return (
                  <button
                    key={image.key}
                    type='button'
                    onClick={() => setSelectedProfile(index)}
                    className={`relative aspect-square w-full overflow-hidden rounded-full border-2 transition ${
                      isSelected ? 'border-[#8B5CF6]' : 'border-white/10'
                    }`}
                  >
                    <div className='relative h-full w-full'>
                      <Image
                        src={image.src}
                        alt={image.label}
                        fill
                        className='object-cover'
                      />
                    </div>
                    {isSelected ? (
                      <span className='absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]'>
                        <Check size={14} className='text-white' />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='rounded-[22px] border border-white/10 bg-[#1B1F2F] p-5 text-white'>
            <div className='flex items-center justify-between gap-3'>
              <Label className='text-[14px] font-semibold'>내 닉네임</Label>
              <span className='text-xs text-[#A3A1B3]'>{nickname.length}/10</span>
            </div>
            <Input
              type='text'
              placeholder='닉네임을 입력해주세요'
              value={nickname}
              maxLength={10}
              onChange={(event) => setNickname(event.target.value)}
              className='mt-3 h-[52px] rounded-[16px] border-white/10 bg-[#151622] px-4 text-white placeholder:text-white/30 focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30'
            />
          </div>

          {error ? (
            <div className='rounded-[14px] border border-[#FF606B]/20 bg-[#2C1722] px-4 py-3 text-sm text-[#FFB3C0]'>
              {error}
            </div>
          ) : null}

          {success ? (
            <div className='rounded-[14px] border border-[#A78BFA]/20 bg-[#1F1A33] px-4 py-3 text-sm text-[#C3B5FF]'>
              {success}
            </div>
          ) : null}
        </div>
      </MobileLayout>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 탈퇴하면 집중했던 데이터가 사라집니다.</DialogTitle>
            <DialogDescription>정말로 탈퇴하시겠어요?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              className='flex-1 h-12 rounded-[14px] border-white/[0.18] text-white/80 bg-transparent hover:bg-white/5'
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              아니요
            </Button>
            <Button
              className='flex-1 h-12 rounded-[14px] font-bold text-white'
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)' }}
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '탈퇴 중...' : '탈퇴'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}
