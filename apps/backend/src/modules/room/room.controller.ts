import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JoinRoomDto } from './dto/join-room.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Room API')
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: '방 생성 (로그인 유저만)' })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        code: 'abc1234',
        url: 'https://ddt.app/room/abc1234',
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    if (req.user.role === 'guest') {
      throw new ForbiddenException('로그인이 필요합니다.');
    }
    return this.roomService.create(createRoomDto, req.user.id);
  }

  @ApiOperation({ summary: '방 ID로 방 정보 조회' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.roomService.find({ id });
  }
  @ApiOperation({ summary: '방 ID로 방 입장' })
  @Post(':id')
  @UseGuards(AuthGuard('jwt'))
  async joinById(
    @Param('id') id: string,
    @Body() joinRoomDto: JoinRoomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isGuest = req.user.role === 'guest';
    return this.roomService.join(
      { id },
      joinRoomDto,
      isGuest ? null : req.user.id,
      isGuest ? req.user.id : null,
    );
  }

  @ApiOperation({ summary: '방 코드로 방 정보 조회' })
  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.roomService.find({ code });
  }

  @ApiOperation({ summary: '방 코드로 방 입장' })
  @Post('code/:code')
  @UseGuards(AuthGuard('jwt'))
  async joinByCode(
    @Param('code') code: string,
    joinRoomDto: JoinRoomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isGuest = req.user.role === 'guest';
    return this.roomService.join(
      { code },
      joinRoomDto,
      isGuest ? null : req.user.id,
      isGuest ? req.user.id : null,
    );
  }
}
