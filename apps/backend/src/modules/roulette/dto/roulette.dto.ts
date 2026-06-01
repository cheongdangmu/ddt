import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SpinRouletteDto {
  @ApiProperty({
    description: '스핀할 룰렛의 인덱스 (1부터 시작)',
    example: 1,
  })
  @IsInt({ message: '스핀 인덱스는 정수여야 합니다.' })
  @Min(1, { message: '스핀 인덱스는 1 이상이어야 합니다.' })
  spinIndex!: number;
}

export class SpinRouletteResponseDto {
  @ApiProperty({ example: 1 })
  spinIndex!: number;

  @ApiProperty({
    example: 'a1b2c3d4-...',
    nullable: true,
    type: String,
    description: '휠 정지 위치 매핑용 PENALTY_ITEM.id (풀에 없으면 null)',
  })
  penaltyItemId!: string | null;

  @ApiProperty({ example: '팔굽혀펴기 10회' })
  penaltyContent!: string;

  @ApiProperty({ example: 2, description: '남은 스핀 수' })
  remainingSpins!: number;

  @ApiProperty({ example: false, description: '모든 기회 소진 여부' })
  isFinished!: boolean;
}

export class RevealedPenaltyDto {
  @ApiProperty({ example: 'a1b2c3d4-...', nullable: true, type: String })
  id!: string | null;

  @ApiProperty({ example: '팔굽혀펴기 10회' })
  content!: string;

  @ApiProperty({ example: 1 })
  count!: number;
}

export class ExitRouletteResponseDto {
  @ApiProperty({ example: true })
  autoRevealed!: boolean;

  @ApiProperty({
    type: [RevealedPenaltyDto],
    description: '이번에 자동 공개된 벌칙',
  })
  revealedPenalties!: RevealedPenaltyDto[];
}
