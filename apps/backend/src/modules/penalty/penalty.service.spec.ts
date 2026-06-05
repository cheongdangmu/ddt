import { PenaltyService } from './penalty.service';
import type { PrismaService } from '../../common/prisma.service';

// 기본 티어 매트릭스 (domain-rules §1) — 최고 등급 count=2
const DEFAULT_TIERS = [
  { tier: 1, minPct: 0, maxPct: 10, count: 0 },
  { tier: 2, minPct: 10, maxPct: 30, count: 1 },
  { tier: 3, minPct: 30, maxPct: null, count: 2 },
];

const ROOM_CODE = 'TESTCODE';
const MEMBER_ID = 'm1';
// 세션 시작 기준 시각. endedAt이 없으므로 계획 종료 시각을 anchor로 사용.
// 마지막 라운드 뒤엔 break가 없으므로 break는 (rounds-1)회 (calcSessionDurationMs와 동일).
const T0 = new Date('2026-06-01T00:00:00.000Z').getTime();
const PLANNED_MS = (25 * 4 + 5 * 3) * 60 * 1000; // 6,900,000
const SESSION_END = T0 + PLANNED_MS;
const GAVE_UP_AT = T0 + 10 * 60 * 1000; // 포기: 시작 10분 후

const POOL = [
  { id: 'p1', content: '팔굽혀펴기', templateId: 't1' },
  { id: 'p2', content: '노래 부르기', templateId: 't1' },
];

type TxMock = {
  escapeLog: { update: jest.Mock };
  roomResult: { findUnique: jest.Mock; create: jest.Mock };
  resultPenalty: { createMany: jest.Mock };
};

describe('PenaltyService.calculateAndSaveForGiveUp', () => {
  let service: PenaltyService;
  let roomFindUnique: jest.Mock;
  let tx: TxMock;

  function buildRoom(member: unknown) {
    return {
      code: ROOM_CODE,
      startedAt: new Date(T0),
      endedAt: null,
      template: {
        focusMin: 25,
        breakMin: 5,
        rounds: 4,
        tierConfig: { tiers: DEFAULT_TIERS },
        penalties: POOL,
      },
      roomMembers: [member],
    };
  }

  beforeEach(() => {
    roomFindUnique = jest.fn();
    tx = {
      escapeLog: { update: jest.fn() },
      roomResult: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      resultPenalty: { createMany: jest.fn() },
    };
    const prismaMock = {
      room: { findUnique: roomFindUnique },
      $transaction: jest.fn((cb: (t: TxMock) => unknown) => cb(tx)),
    };
    service = new PenaltyService(prismaMock as unknown as PrismaService);
  });

  it('forfeit 최고 등급으로 산정하고 전체 벌칙을 is_revealed=true로 생성한다', async () => {
    roomFindUnique.mockResolvedValue(
      buildRoom({
        id: MEMBER_ID,
        gaveUpAt: new Date(GAVE_UP_AT),
        // 이미 복귀 마감된 로그 1건 (durationMs 60초)
        escapeLogs: [
          {
            id: 'l1',
            escapedAt: new Date(T0),
            returnedAt: new Date(T0 + 60000),
            durationMs: 60000,
          },
        ],
      }),
    );

    await service.calculateAndSaveForGiveUp(ROOM_CODE, MEMBER_ID);

    // totalEscapeMs = 닫힌 로그(60,000) + 잔여(SESSION_END - GAVE_UP_AT)
    const residual = SESSION_END - GAVE_UP_AT; // 6,300,000
    expect(tx.roomResult.create).toHaveBeenCalledWith({
      data: {
        roomMemberId: MEMBER_ID,
        roomCode: ROOM_CODE,
        totalEscapeMs: 60000 + residual,
        penaltyTier: 3,
      },
    });

    // forfeit count=2, pool=2 → 두 벌칙 각 1회, 전부 공개
    const createManyCalls = tx.resultPenalty.createMany.mock.calls as Array<
      [{ data: { content: string; count: number; isRevealed: boolean }[] }]
    >;
    const createManyArg = createManyCalls[0][0];
    expect(createManyArg.data).toHaveLength(2);
    expect(createManyArg.data.every((d) => d.isRevealed === true)).toBe(true);
    expect(createManyArg.data.map((d) => d.content).sort()).toEqual(
      ['노래 부르기', '팔굽혀펴기'].sort(),
    );
  });

  it('미복귀(returnedAt=null) 로그를 계획 종료 시각으로 마감하고 잔여까지 합산한다', async () => {
    const escapedAt = T0 + 5 * 60 * 1000; // 시작 5분 후 이탈, 미복귀
    roomFindUnique.mockResolvedValue(
      buildRoom({
        id: MEMBER_ID,
        gaveUpAt: new Date(GAVE_UP_AT),
        escapeLogs: [
          {
            id: 'l1',
            escapedAt: new Date(escapedAt),
            returnedAt: null,
            durationMs: null,
          },
        ],
      }),
    );

    await service.calculateAndSaveForGiveUp(ROOM_CODE, MEMBER_ID);

    // 미복귀 로그를 SESSION_END으로 마감
    const openDuration = SESSION_END - escapedAt; // 6,600,000
    expect(tx.escapeLog.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { returnedAt: new Date(SESSION_END), durationMs: openDuration },
    });

    const residual = SESSION_END - GAVE_UP_AT; // 6,300,000
    expect(tx.roomResult.create).toHaveBeenCalledWith({
      data: {
        roomMemberId: MEMBER_ID,
        roomCode: ROOM_CODE,
        totalEscapeMs: openDuration + residual,
        penaltyTier: 3,
      },
    });
  });

  it('멱등성: 이미 결과가 존재하면 생성하지 않는다', async () => {
    tx.roomResult.findUnique.mockResolvedValue({ roomMemberId: MEMBER_ID });
    roomFindUnique.mockResolvedValue(
      buildRoom({
        id: MEMBER_ID,
        gaveUpAt: new Date(GAVE_UP_AT),
        escapeLogs: [],
      }),
    );

    await service.calculateAndSaveForGiveUp(ROOM_CODE, MEMBER_ID);

    expect(tx.roomResult.create).not.toHaveBeenCalled();
    expect(tx.resultPenalty.createMany).not.toHaveBeenCalled();
  });
});
