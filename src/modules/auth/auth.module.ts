import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/core/strategies/jwt.strategy';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { RefreshToken } from './refresh-token.entity';
import { RefreshTokenRepository } from '@/infrastructure/repositories/refresh-token.repository';
import { WalletModule } from '../wallets/wallets.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenCleanupService } from './token-cleanup.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_default_secret',
      signOptions: { expiresIn: '24h' },
    }),
    AdminModule,
    UserModule,
    PassportModule,
    NotificationModule,
    WalletModule,
  ],
  providers: [
    AuthService,
    TokenCleanupService,
    JwtStrategy,
    RefreshTokenRepository,
  ],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
