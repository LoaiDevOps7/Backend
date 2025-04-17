import {
  Controller,
  Post,
  Body,
  Res,
  UnauthorizedException,
  Req,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminService } from '../admin/admin.service';
import { AuthGuard } from '@nestjs/passport';
import { CookieOptions } from 'express-serve-static-core';

// DTO (كائن لنقل بيانات تسجيل الدخول)
export class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
  ) {}

  private getCookieOptions(host: string): {
    accessToken: CookieOptions;
    refreshToken: CookieOptions;
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    const mainDomain = this.extractMainDomain(host);

    return {
      accessToken: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? mainDomain : undefined,
        partitioned: isProduction,
        path: '/',
        maxAge: 15 * 60 * 1000,
      },
      refreshToken: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? mainDomain : undefined,
        partitioned: isProduction,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    };
  }

  private extractMainDomain(host?: string): string | undefined {
    if (!host) return undefined;
    const parts = host.split('.');
    if (parts.length > 2) return `.${parts.slice(-2).join('.')}`;
    return `.${host}`;
  }

  @Post('admin/create')
  async createAdmin(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('roles') roles: string[],
  ) {
    return this.adminService.createAdmin(username, password, roles);
  }

  @Post('admin/login')
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const admin = await this.authService.validateAdmin(
      loginDto.username,
      loginDto.password,
    );
    if (!admin) {
      throw new UnauthorizedException('بيانات الاعتماد غير صحيحة');
    }

    const { access_token, refresh_token } =
      await this.authService.loginAdmin(admin);

    const host = req.headers.host || '';
    const cookieOptions = this.getCookieOptions(host);

    res
      .cookie('authToken', access_token, cookieOptions.accessToken)
      .cookie('refreshToken', refresh_token, cookieOptions.refreshToken);

    return { message: 'Login successful' };
  }

  @Post('register')
  async register(@Body() registerDto: AuthDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: AuthDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { access_token, refresh_token } =
      await this.authService.login(loginDto);

    const host = req.headers.host || '';
    const cookieOptions = this.getCookieOptions(host);

    res
      .cookie('authToken', access_token, cookieOptions.accessToken)
      .cookie('refreshToken', refresh_token, cookieOptions.refreshToken);

    return { message: 'Login successful' };
  }

  @Post('verify-email')
  async verifyEmail(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyEmail(email, code);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationCode(email);
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // استخراج refresh token من الكوكيز بدلاً من الـ headers
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const { access_token, refresh_token } =
      await this.authService.refreshToken(refreshToken);

    const host = req.headers.host || '';
    const cookieOptions = this.getCookieOptions(host);

    res
      .clearCookie('authToken', cookieOptions.accessToken)
      .clearCookie('refreshToken', cookieOptions.refreshToken)
      .cookie('authToken', access_token, cookieOptions.accessToken)
      .cookie('refreshToken', refresh_token, cookieOptions.refreshToken);

    return { access_token };
  }

  @Get('validate-token')
  @UseGuards(AuthGuard('jwt'))
  validateToken(@Req() req: Request) {
    return {
      valid: true,
      user: req.user,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const { message, userId } =
      await this.authService.sendResetPasswordEmail(email);
    return { message, userId };
  }

  @Post('verify-reset-code')
  async verifyResetCode(
    @Body('userId') userId: number,
    @Body('resetCode') resetCode: string,
  ) {
    return this.authService.verifyResetCode(userId, resetCode);
  }

  @Post('reset-password/:userId')
  async resetPassword(
    @Param('userId') userId: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const { newPassword } = resetPasswordDto;
    return this.authService.resetPassword(userId, newPassword);
  }
}
