import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Req, 
  Res, 
  UseGuards, 
  HttpException, 
  HttpStatus,
  BadRequestException,
  ConflictException,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  // 프론트엔드에서 버튼 클릭 시 진입하는 주소
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
  }

  // 구글 인증 후 돌아오는 콜백 주소
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const googleProfile = req.user;
    const user = await this.authService.validateOAuthLogin(googleProfile);
    const token = this.authService.generateJwt(user);

    const frontendUrl = process.env.FRONTEND_URL;

    const htmlResponse = `
      <html>
        <body>
          <script>
            // 부모 창으로 토큰 정보 전송
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', token: '${token}' }, '${frontendUrl}');
            // 팝업창 닫기
            window.close();
          </script>
        </body>
      </html>
    `;

    res.send(htmlResponse);
  }

  @Post('guest')
  guestLogin() {
    const result = this.authService.generateGuestToken();
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/auth/guest",
      message: "비회원 토큰이 발급되었습니다.",
      data: result,
      error: null
    };
  }

  @UseGuards(AuthGuard('jwt')) 
  @Post('terms')
  async agreeTerms(@Req() req, @Body() body: any) {
    try {
      const data = await this.authService.agreeTerms(req.user.id, body);
      return {
        statusCode: 200,
        timestamp: new Date().toISOString(),
        path: "/auth/terms",
        message: "약관 동의가 완료되었습니다.",
        data: data,
        error: null
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException({
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/auth/terms",
          message: "필수 약관에 동의해주세요.",
          data: null,
          error: "INVALID_REQUEST"
        }, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof ConflictException) {
        throw new HttpException({
          statusCode: 409,
          timestamp: new Date().toISOString(),
          path: "/auth/terms",
          message: "이미 약관 동의가 완료된 계정입니다.",
          data: null,
          error: "ALREADY_AGREED"
        }, HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException();

      const data = await this.authService.logout(token);
      return {
        statusCode: 200,
        timestamp: new Date().toISOString(),
        path: "/auth/logout",
        message: "로그아웃이 완료되었습니다.",
        data: data,
        error: null
      };
    } catch (error) {
      throw new HttpException({
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: "/auth/logout",
        message: "유효하지 않은 인증 토큰입니다.",
        data: null,
        error: "UNAUTHORIZED"
      }, HttpStatus.UNAUTHORIZED);
    }
  }
}