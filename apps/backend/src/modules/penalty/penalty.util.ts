export type TierConfig = {
  tier: number;
  minPct: number;
  maxPct: number | null;
  count: number;
};

export type TierResult = {
  penaltyCount: number;
  isForceAll: boolean;
};

/**
 * 벌칙 산정 함수
 * @param totalEscapeSeconds 이탈 총 누적 시간(초)
 * @param focusMin 회차당 집중 시간(분)
 * @param rounds 전체 라운드 수
 * @param tiers 티어 설정 객체 배열
 */
export function calculatePenaltyTier(
  totalEscapeSeconds: number,
  focusMin: number,
  rounds: number,
  tiers: TierConfig[],
): TierResult {
  // 1. All Clear 판정
  if (totalEscapeSeconds === 0) {
    return { penaltyCount: 0, isForceAll: false };
  }

  // 2. 이탈 비율 계산 (기획서 공식 적용)
  // escapePercent = total_escape_ms / (focusMin * rounds * 60 * 1000) * 100
  // totalEscapeSeconds를 ms로 변환: totalEscapeSeconds * 1000
  const totalFocusMs = focusMin * rounds * 60 * 1000;
  const totalEscapeMs = totalEscapeSeconds * 1000;
  const escapePercent = (totalEscapeMs / totalFocusMs) * 100;

  // 3. 티어 정렬
  const sortedTiers = [...tiers].sort((a, b) => a.minPct - b.minPct);

  for (const tier of sortedTiers) {
    // 최고 등급 (maxPct === null)인 경우
    if (tier.maxPct === null) {
      if (escapePercent >= tier.minPct) {
        return { penaltyCount: tier.count, isForceAll: true };
      }
      continue;
    }

    // 일반 구간 (minPct <= x < maxPct)
    if (escapePercent >= tier.minPct && escapePercent < tier.maxPct) {
      return { penaltyCount: tier.count, isForceAll: false };
    }
  }

  return { penaltyCount: 0, isForceAll: false };
}
