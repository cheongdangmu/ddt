export const PROFILE_IMAGE_OPTIONS = [
  { key: 'AVATAR_BEAR', src: '/avatars/bear.png', label: 'bear' },
  { key: 'AVATAR_CAT', src: '/avatars/cat.png', label: 'cat' },
  { key: 'AVATAR_CROCODILE', src: '/avatars/crocodile.png', label: 'crocodile' },
  { key: 'AVATAR_FOX', src: '/avatars/fox.png', label: 'fox' },
  { key: 'AVATAR_HEDGEHOG', src: '/avatars/hedgehog.png', label: 'hedgehog' },
  { key: 'AVATAR_MONKEY', src: '/avatars/monkey.png', label: 'monkey' },
  { key: 'AVATAR_PENGUIN', src: '/avatars/penguin.png', label: 'penguin' },
  { key: 'AVATAR_PIG', src: '/avatars/pig.png', label: 'pig' },
  { key: 'AVATAR_RABBIT', src: '/avatars/rabbit.png', label: 'rabbit' },
  { key: 'AVATAR_SHIBA', src: '/avatars/shiba.png', label: 'shiba' },
] as const;

export const DEFAULT_PROFILE_IMAGE_KEY = 'AVATAR_BEAR';

const activeToLegacyProfileKey: Record<string, string> = {
  AVATAR_BEAR: 'basic_image_key_01',
  AVATAR_CAT: 'basic_image_key_02',
  AVATAR_CROCODILE: 'basic_image_key_03',
  AVATAR_FOX: 'basic_image_key_04',
  AVATAR_HEDGEHOG: 'basic_image_key_05',
  AVATAR_MONKEY: 'basic_image_key_06',
  AVATAR_PENGUIN: 'basic_image_key_07',
  AVATAR_PIG: 'basic_image_key_08',
  AVATAR_RABBIT: 'basic_image_key_09',
  AVATAR_SHIBA: 'basic_image_key_10',
};

const legacyProfileImageMap: Record<string, string> = {
  DEFAULT_PROFILE_1: '/avatars/bear.png',
  basic_image_key_01: '/avatars/bear.png',
  basic_image_key_02: '/avatars/cat.png',
  basic_image_key_03: '/avatars/crocodile.png',
  basic_image_key_04: '/avatars/fox.png',
  basic_image_key_05: '/avatars/hedgehog.png',
  basic_image_key_06: '/avatars/monkey.png',
  basic_image_key_07: '/avatars/penguin.png',
  basic_image_key_08: '/avatars/pig.png',
  basic_image_key_09: '/avatars/rabbit.png',
  basic_image_key_10: '/avatars/shiba.png',
  char_01: '/avatars/bear.png',
  char_02: '/avatars/cat.png',
  char_03: '/avatars/crocodile.png',
  char_04: '/avatars/fox.png',
  char_05: '/avatars/hedgehog.png',
  char_06: '/avatars/monkey.png',
  char_07: '/avatars/penguin.png',
  char_08: '/avatars/pig.png',
  char_09: '/avatars/rabbit.png',
  char_10: '/avatars/shiba.png',
};

const legacyToActiveProfileKey = Object.entries(activeToLegacyProfileKey).reduce(
  (acc, [active, legacy]) => ({ ...acc, [legacy]: active }),
  {} as Record<string, string>,
);

export const getProfileImageSrc = (key?: string | null) => {
  if (!key) return undefined;

  const option = PROFILE_IMAGE_OPTIONS.find((item) => item.key === key);
  return option?.src ?? legacyProfileImageMap[key];
};

export const getLegacyProfileImageKey = (key?: string | null) => {
  if (!key) return undefined;
  return activeToLegacyProfileKey[key] ?? key;
};

export const getProfileImageOptionKey = (key?: string | null) => {
  if (!key) return undefined;
  if (PROFILE_IMAGE_OPTIONS.some((item) => item.key === key)) return key;
  return legacyToActiveProfileKey[key];
};
