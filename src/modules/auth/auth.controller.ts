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

    // تعيين الـ cookies مع إعدادات آمنة
    res.cookie('authToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRY_MS),
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.COOKIE_DOMAIN, // تأكد من ضبط هذا المتغير
      path: '/',
    });

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRY_MS),
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    });

    return { message: 'Login successful', access_token, refresh_token };
  }

  @Post('register')
  async register(@Body() registerDto: AuthDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.login(loginDto);

    // تعيين الـ cookies مع إعدادات آمنة
    res.cookie('authToken', access_token, {
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRY_MS),
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refresh_token, {
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRY_MS),
      sameSite: 'lax',
    });

    return { access_token, refresh_token };
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

    // تحديث الكوكيز بالتوكنات الجديدة
    res.cookie('authToken', access_token, {
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRY_MS),
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refresh_token, {
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRY_MS),
      sameSite: 'lax',
    });

    return {
      access_token,
      refresh_token,
    };
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
