import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { JoinRoomDto } from './dto/join-room.dto';

interface RoomMember {
  nickname: string;
  isLoggedIn: boolean;
  isHost: boolean;
  connected: boolean;
  profileImage: string;
}

interface RoomState {
  roomId: string;
  code: string;
  hostId: string;
  phase: string;
  members: Record<string, RoomMember>;
}

export interface CreateRoomResult {
  code: string;
  url: string;
}

@Injectable()
export class RoomService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    hostId: string,
  ): Promise<CreateRoomResult> {
    const { title, password, nickname, profileImage } = createRoomDto;

    const code = nanoid(8);
    const passwordHash = await bcrypt.hash(password, 10);

    const room = await this.prismaService.room.create({
      data: {
        code,
        title,
        hostId,
        passwordHash,
        phase: 'lobby',
      },
    });

    await this.prismaService.roomMember.create({
      data: {
        roomId: room.id,
        userId: hostId,
        nickname: nickname,
        isHost: true,
        isLoggedIn: true,
        profileImage: profileImage,
      },
    });

    const roomState: RoomState = {
      roomId: room.id,
      code: room.code,
      hostId,
      phase: 'lobby',
      members: {
        [hostId]: {
          nickname,
          isLoggedIn: true,
          isHost: true,
          connected: false,
          profileImage,
        },
      },
    };

    await this.redisService.instance.set(
      `room:state:${room.id}`,
      JSON.stringify(roomState),
      'EX',
      7200,
    );

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    return {
      code,
      url: `${frontendUrl}/room/${room.code}`,
    };
  }

  async find(identifier: { id: string } | { code: string }) {
    const room = await this.prismaService.room.findUnique({
      where: identifier,
      select: {
        id: true,
        title: true,
        phase: true,
        _count: { select: { roomMembers: true } },
      },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    if (room.phase === 'result' || room.phase === 'closed') {
      throw new ForbiddenException('종료된 방입니다.');
    }

    return {
      title: room.title,
      id: room.id,
      memberCount: room._count.roomMembers,
      phase: room.phase,
    };
  }

  async join(
    identifier: { id: string } | { code: string },
    joinRoomDto: JoinRoomDto,
    userId: string | null,
    guestToken: string | null,
  ): Promise<{ id: string; isReturning: boolean }> {
    const { nickname, password, profileImage } = joinRoomDto;
    const room = await this.prismaService.room.findUnique({
      where: identifier,
      select: {
        id: true,
        passwordHash: true,
        phase: true,
        _count: { select: { roomMembers: true } },
      },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    if (room.phase === 'result' || room.phase === 'closed') {
      throw new ForbiddenException('종료된 방입니다.');
    }

    const existing = userId
      ? await this.prismaService.roomMember.findUnique({
          where: { roomId_userId: { roomId: room.id, userId } },
        })
      : null;

    const isReturning = userId
      ? !!existing
      : !!(
          guestToken &&
          (await this.prismaService.roomMember.findFirst({
            where: { roomId: room.id, guestToken },
          }))
        );

    if (room.phase === 'timer' && !isReturning) {
      throw new ForbiddenException('이미 진행중인 방입니다.');
    }

    const isValid = await bcrypt.compare(password, room.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    if (!isReturning && room._count.roomMembers >= 10) {
      throw new ConflictException('방이 가득 찼습니다.');
    }

    if (userId) {
      await this.prismaService.roomMember.upsert({
        where: {
          roomId_userId: { roomId: room.id, userId },
        },
        update: {
          nickname: existing ? existing.nickname : nickname, // 재접속이면 기존 닉네임 유지
          profileImage: existing ? existing.profileImage : profileImage,
        },
        create: {
          roomId: room.id,
          userId,
          nickname: nickname,
          isHost: false,
          isLoggedIn: true,
          profileImage,
        },
      });

      const raw = await this.redisService.instance.get(`room:state:${room.id}`);
      if (raw) {
        const state = JSON.parse(raw) as RoomState;

        if (!state.members[userId]) {
          state.members[userId] = {
            nickname,
            isLoggedIn: true,
            isHost: false,
            connected: false,
            profileImage,
          };
          await this.redisService.instance.set(
            `room:state:${room.id}`,
            JSON.stringify(state),
            'EX',
            7200,
          );
        }
      }
    } else {
      if (!joinRoomDto.nickname) {
        throw new BadRequestException('닉네임을 입력해주세요.');
      }

      if (!guestToken) {
        throw new UnauthorizedException('게스트 토큰이 없습니다.');
      }

      if (!isReturning) {
        await this.prismaService.roomMember.create({
          data: {
            roomId: room.id,
            userId: null,
            guestToken,
            nickname: joinRoomDto.nickname,
            isHost: false,
            isLoggedIn: false,
            profileImage: joinRoomDto.profileImage,
          },
        });

        const raw = await this.redisService.instance.get(
          `room:state:${room.id}`,
        );

        if (raw) {
          const state = JSON.parse(raw) as RoomState;

          state.members[guestToken] = {
            nickname,
            isLoggedIn: false,
            isHost: false,
            connected: false,
            profileImage,
          };
          await this.redisService.instance.set(
            `room:state:${room.id}`,
            JSON.stringify(state),
            'EX',
            7200,
          );
        }
      }
    }

    return { id: room.id, isReturning };
  }
}
