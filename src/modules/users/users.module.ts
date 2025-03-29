import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { RefreshTokenRepository } from '@/infrastructure/repositories/refresh-token.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { JwtGuard } from '@/core/guards/jwt.guard';
import { JwtStrategy } from '@/core/strategies/jwt.strategy';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    forwardRef(() => AuthModule),
  ],
  providers: [
    UsersService,
    RefreshTokenRepository,
    UserRepository,
    JwtGuard,
    JwtStrategy,
  ],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UserModule {}
