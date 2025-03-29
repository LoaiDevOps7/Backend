import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@/core/guards/roles.guard';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/users/users.module';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { ChatModule } from '@/modules/chats/chat.module';
import { MonitoringModule } from '@/modules/monitoring/monitoring.module';
import { SubscriptionModule } from '@/modules/subscriptions/subscription.module';
import { PackageModule } from '@/modules/packages/package.module';
import { KycModule } from '@/modules/kyc/kyc.module';
import { CategoryModule } from '@/modules/categories/categories.module';
import * as redisStore from 'cache-manager-redis-store';
import * as mysql2 from 'mysql2';
import { BidModule } from '@/modules/bids/bid.module';
import { ProjectModule } from '@/modules/projects/projects.module';
import { WalletModule } from '@/modules/wallets/wallets.module';
import { RatingModule } from '@/modules/ratings/ratings.module';
import { ThemesModule } from '@/modules/themes/themes.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ActivityService } from '@/modules/activities/activity.service';
import { ActivityGateway } from '@/modules/activities/activity.gateway';
import { SchedulerService } from '@/modules/activities/scheduler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
    } as any),
    TypeOrmModule.forRoot({
      type: 'mysql',
      driver: mysql2,
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      // نقدم مجلد "src/infrastructure/storage" كأصول ثابتة
      rootPath: join(__dirname, '..', 'src/infrastructure/storage'),
      // تصبح الملفات متاحة على URL يبدأ بـ "/src/infrastructure/storage"
      serveRoot: '/src/infrastructure/storage',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_default_secret',
      signOptions: { expiresIn: '24h' },
    }),
    AdminModule,
    AuthModule,
    UserModule,
    NotificationModule,
    ChatModule,
    MonitoringModule,
    SubscriptionModule,
    PackageModule,
    KycModule,
    CategoryModule,
    ProjectModule,
    BidModule,
    WalletModule,
    RatingModule,
    ThemesModule,
    PortfoliosModule,
  ],
  providers: [
    ActivityGateway,
    ActivityService,
    SchedulerService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
