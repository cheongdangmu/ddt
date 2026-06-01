import { ApiProperty } from '@nestjs/swagger';

export class ResultPenaltyItemDto {
  @ApiProperty({ example: '팔굽혀펴기 10회' })
  content!: string;

  @ApiProperty({ example: 1 })
  count!: number;
}

export class ResultMemberPenaltiesDto {
  @ApiProperty({ example: 1, description: '배정된 전체 벌칙 수(미공개 포함)' })
  totalCount!: number;

  @ApiProperty({
    type: [ResultPenaltyItemDto],
    description: '공개된 벌칙만 content 포함 (미공개는 미반환)',
  })
  items!: ResultPenaltyItemDto[];
}

export class ResultMemberDto {
  @ApiProperty({ example: 'uuid' })
  memberId!: string;

  @ApiProperty({ example: 'user-uuid', nullable: true, type: String })
  userId!: string | null;

  @ApiProperty({ example: '집중왕' })
  nickname!: string;

  @ApiProperty({
    example: 'https://example.com/p.png',
    nullable: true,
    type: String,
  })
  profileImage!: string | null;

  @ApiProperty({ example: false })
  isHost!: boolean;

  @ApiProperty({ example: true })
  isLoggedIn!: boolean;

  @ApiProperty({ example: 1, description: '이탈 시간 기준 순위' })
  rank!: number;

  @ApiProperty({ example: 60000, description: '총 이탈 시간(ms)' })
  totalEscapeMs!: number;

  @ApiProperty({ example: 1 })
  penaltyTier!: number;

  @ApiProperty({ example: false })
  isAllClear!: boolean;

  @ApiProperty({ example: 1, description: '공개된 벌칙 수' })
  penaltyCount!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  gaveUpAt!: Date | null;

  @ApiProperty({ type: ResultMemberPenaltiesDto })
  penalties!: ResultMemberPenaltiesDto;
}

export class ResultRulePenaltyDto {
  @ApiProperty({ example: 'uuid' })
  itemId!: string;

  @ApiProperty({ example: '팔굽혀펴기 10회' })
  content!: string;
}

export class ResultRuleDto {
  @ApiProperty({ example: 25 })
  focusMin!: number;

  @ApiProperty({ example: 5 })
  breakMin!: number;

  @ApiProperty({ example: 4 })
  rounds!: number;

  @ApiProperty({ type: [ResultRulePenaltyDto], description: '벌칙 풀(공개)' })
  penalties!: ResultRulePenaltyDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: '티어 설정 JSON',
  })
  tierConfig!: Record<string, unknown>;
}

export class ResultResponseDto {
  @ApiProperty({ example: 'V1StGXR8' })
  roomCode!: string;

  @ApiProperty({ example: '스터디방' })
  roomTitle!: string;

  @ApiProperty({
    example: 7200000,
    nullable: true,
    type: Number,
    description: '총 세션 시간(ms)',
  })
  totalSessionMs!: number | null;

  @ApiProperty({
    example: '2026-05-29T01:00:00.000Z',
    format: 'date-time',
    description: '서버 현재 시각(클라 시계 보정용)',
  })
  serverTime!: Date;

  @ApiProperty({
    example: '2026-05-29T01:10:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
    description: '룰렛 카운트다운 종료 시각(ISO). null이면 미정',
  })
  rouletteEndsAt!: Date | null;

  @ApiProperty({ example: 4, nullable: true, type: Number })
  completedRounds!: number | null;

  @ApiProperty({ example: 2, description: '벌칙 대상 인원수' })
  penaltyMemberCount!: number;

  @ApiProperty({ example: false })
  allClear!: boolean;

  @ApiProperty({ type: [ResultMemberDto] })
  members!: ResultMemberDto[];

  @ApiProperty({ type: ResultRuleDto, nullable: true })
  rule!: ResultRuleDto | null;
}
