import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionRepository } from '@/infrastructure/repositories/subscription.repository';
import { Subscription } from './subscription.entity';
import { PackageModule } from '../packages/package.module';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { FeaturesGuard } from '@/core/guards/features.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PackageModule,
    UserModule,
    JwtModule,
  ],
  providers: [
    SubscriptionService,
    SubscriptionRepository,
    FeaturesGuard,
    Reflector,
  ],
  controllers: [SubscriptionController],
  exports: [SubscriptionRepository],
})
export class SubscriptionModule {}
