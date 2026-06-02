import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RouletteService } from './roulette.service';
import {
  SpinRouletteDto,
  SpinRouletteResponseDto,
  ExitRouletteResponseDto,
} from './dto/roulette.dto';
import { ApiSuccessResponse } from '../../common/swagger/api-success-response.decorator';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Roulette API (벌칙 룰렛)')
@Controller('rooms')
export class RouletteController {
  constructor(private readonly rouletteService: RouletteService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: '룰렛 실행',
    description: 'spinIndex(1부터)의 벌칙을 공개합니다.',
  })
  @ApiParam({
    name: 'roomCode',
    description: '방 코드 (8자리)',
    example: 'V1StGXR8',
  })
  @ApiBody({ type: SpinRouletteDto })
  @ApiSuccessResponse(SpinRouletteResponseDto, {
    status: 201,
    description: '스핀 성공',
  })
  @ApiResponse({
    status: 400,
    description: '룰렛 정보가 없거나 해당 스핀의 벌칙이 없습니다.',
  })
  @ApiResponse({ status: 409, description: '이미 실행된 룰렛입니다.' })
  @Post(':roomCode/roulette/spin')
  @UseGuards(AuthGuard('jwt'))
  async spinRoulette(
    @Param('roomCode') roomCode: string,
    @Body() dto: SpinRouletteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isGuest = req.user.role === 'guest';
    const data = await this.rouletteService.spinRoulette(
      roomCode,
      dto.spinIndex,
      isGuest ? null : req.user.id,
      isGuest ? req.user.id : null,
    );
    return { message: '룰렛이 스핀되었습니다.', data };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '룰렛 이탈 처리 (Rage-quit)',
    description: '룰렛 도중 이탈 시 남은 벌칙을 모두 자동 공개 처리합니다.',
  })
  @ApiParam({
    name: 'roomCode',
    description: '방 코드 (8자리)',
    example: 'V1StGXR8',
  })
  @ApiSuccessResponse(ExitRouletteResponseDto, {
    status: 201,
    description: '이탈 처리 성공',
  })
  @ApiResponse({
    status: 400,
    description: '멤버 정보를 찾을 수 없거나 이미 처리 완료되었습니다.',
  })
  @Post(':roomCode/roulette/exit')
  @UseGuards(AuthGuard('jwt'))
  async exitRoulette(
    @Param('roomCode') roomCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isGuest = req.user.role === 'guest';
    const data = await this.rouletteService.exitRoulette(
      roomCode,
      isGuest ? null : req.user.id,
      isGuest ? req.user.id : null,
    );
    return { message: '룰렛이 처리되었습니다.', data };
  }
}
