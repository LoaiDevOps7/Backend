// auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { NotificationService } from '../notifications/notification.service';
import { AuthDto } from './dto/auth.dto';
import { JwtPayload } from '@/core/interfaces/jwt-payload.interface';
import { NotificationChannel } from '../notifications/types/notification.types';
import { User } from '../users/users.entity';
import { RefreshToken } from './refresh-token.entity';
import { RefreshTokenRepository } from '@/infrastructure/repositories/refresh-token.repository';
import { WalletService } from '../wallets/wallets.service';
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    private refreshTokenRepo: RefreshTokenRepository,
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly walletService: WalletService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<any> {
    const admin = await this.adminService.findOne(username);
    if (admin && (await bcrypt.compare(password, admin.password))) {
      // إزالة الحقل الخاص بكلمة السر من النتيجة
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = admin;
      return result;
    }
    return null;
  }

  async loginAdmin(admin: any) {
    const payload: JwtPayload = {
      username: admin.username,
      sub: admin.id,
      roles: admin.roles,
    };
    const access_token = await this.generateToken(payload);
    const refreshToken = await this.generateNewRefreshToken(admin);
    return {
      access_token,
      refresh_token: refreshToken.token,
    };
  }

  async generateToken(payload: JwtPayload) {
    // تأكد من أن مفتاح JWT ومدة الصلاحية مُحددة في متغيرات البيئة
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY;
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  private async generateNewRefreshToken(
    entity: User | Admin,
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken(); // إنشاء كائن جديد من نوع RefreshToken
    refreshToken.token = crypto.randomBytes(40).toString('hex');
    refreshToken.expiresAt = new Date(
      Date.now() +
        (Number(process.env.REFRESH_TOKEN_EXPIRY_MS) ||
          7 * 24 * 60 * 60 * 1000),
    );

    if ('email' in entity) {
      refreshToken.user = entity as User;
    } else {
      refreshToken.admin = entity as Admin;
    }

    return await this.refreshTokenRepo.save(refreshToken);
  }

  async generateVerificationCode(): Promise<string> {
    return crypto.randomInt(100000, 999999).toString();
  }

  async register(registerDto: AuthDto) {
    const { email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // استخدام عدد جولات تجزئة من متغير البيئة أو القيمة الافتراضية (12)
    const saltRounds = Number(process.env.SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const verificationCode = await this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 3600000);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      roles: ['Freelancer'],
      verificationCode,
      verificationCodeExpiry,
    });

    await this.notificationService.sendNotification(
      'verification-email',
      email,
      { code: verificationCode },
      [NotificationChannel.EMAIL],
    );

    return {
      message: 'Verification code sent to your email',
      userId: user.id,
    };
  }

  async login(loginDto: AuthDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('البريد الإلكتروني غير مفعّل');
    }

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    const access_token = await this.generateToken(payload);
    const refreshToken = await this.generateNewRefreshToken(user);

    return {
      access_token,
      refresh_token: refreshToken.token,
    };
  }

  async refreshToken(refreshToken: string) {
    console.log('Received refreshToken:', refreshToken);
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user', 'admin'],
    });

    if (!tokenEntity) {
      console.log('Refresh token not found in DB or already revoked.');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (tokenEntity.expiresAt.getTime() < Date.now()) {
      console.log('Refresh token expired.');
      throw new UnauthorizedException('Refresh token expired');
    }

    // إبطال الـ refresh token القديم لمنع إعادة الاستخدام
    tokenEntity.revoked = true;
    await this.refreshTokenRepo.save(tokenEntity);

    let payload: JwtPayload;
    // التحقق أي علاقة موجودة، سواء User أو Admin
    if (tokenEntity.user) {
      payload = {
        email: tokenEntity.user.email, // تأكد من وجود حقل email في كيان User
        sub: tokenEntity.user.id,
        roles: tokenEntity.user.roles,
      };
    } else if (tokenEntity.admin) {
      payload = {
        username: tokenEntity.admin.username, // إذا لم يتوفر email، يمكن استخدام username أو تعديل الكيان
        sub: tokenEntity.admin.id,
        roles: tokenEntity.admin.roles,
      };
    } else {
      throw new UnauthorizedException(
        'Invalid token: no associated user or admin',
      );
    }

    const newAccessToken = await this.generateToken(payload);
    const newRefreshTokenEntity = tokenEntity.user
      ? await this.generateNewRefreshToken(tokenEntity.user)
      : await this.generateNewRefreshToken(tokenEntity.admin);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshTokenEntity.token,
    };
  }

  async verifyEmail(email: string, code: string) {
    try {
      const user = await this.usersService.findByEmail(email);

      if (
        !user ||
        user.verificationCode !== code ||
        user.verificationCodeExpiry < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired verification code');
      }

      await this.walletService.createWallet(user.id, 'SPY');
      await this.usersService.verifyEmail(user.id);

      return { message: 'Email verified successfully' };
    } catch {
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async resendVerificationCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const newVerificationCode = await this.generateVerificationCode();
    user.verificationCode = newVerificationCode;
    user.verificationCodeExpiry = new Date(Date.now() + 3600000);

    await this.usersService.updateUser(user.id, {
      verificationCode: newVerificationCode,
      verificationCodeExpiry: user.verificationCodeExpiry,
    });

    await this.notificationService.sendNotification(
      'verification-email',
      email,
      { code: newVerificationCode },
      [NotificationChannel.EMAIL],
    );

    return { message: 'Verification code resent successfully' };
  }

  async sendResetPasswordEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const now = new Date();

    // إذا كان هناك رمز تحقق نشط ولم ينتهِ صلاحيته، يمكن إعادة إرساله
    if (user.resetCode && user.resetCodeExpiry > now) {
      await this.notificationService.sendNotification(
        'reset-password-email',
        email,
        { resetCode: user.resetCode },
        [NotificationChannel.EMAIL],
      );
      return { message: 'Reset password email re-sent', userId: user.id };
    }

    const resetCode = await this.generateVerificationCode();
    user.resetCode = resetCode;
    user.resetCodeExpiry = new Date(now.getTime() + 3600000);

    await this.usersService.updateUser(user.id, {
      resetCode,
      resetCodeExpiry: user.resetCodeExpiry,
    });

    await this.notificationService.sendNotification(
      'reset-password-email',
      email,
      { resetCode },
      [NotificationChannel.EMAIL],
    );

    return { message: 'Reset password email sent', userId: user.id };
  }

  async verifyResetCode(userId: number, resetCode: string) {
    const user = await this.usersService.findById(userId);

    if (
      !user ||
      user.resetCode !== resetCode ||
      user.resetCodeExpiry < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    return { message: 'Reset code verified successfully' };
  }

  async resetPassword(userId: number, newPassword: string) {
    const user = await this.usersService.findById(userId);

    const saltRounds = Number(process.env.SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.usersService.updatePassword(user.id, hashedPassword);

    await this.usersService.clearResetCode(user.id);

    return { message: 'Password reset successfully' };
  }
}
