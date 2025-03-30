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
// import * as mysql2 from 'mysql2';
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
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrometheusModule.register(),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
      ttl: 3600, // 1 hour
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    }),
    ThrottlerModule.forRoot({
      ttl: 30,
      limit: 20,
    } as any),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DATABASE_URL, // ← استخدام المتغير التلقائي
      ssl: {
        rejectUnauthorized: false, // ضروري لـ Railway
      },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      extra: {
        connectionLimit: 5, // ← تحديد عدد الاتصالات
      },

      // driver: mysql2,
      // host: process.env.MYSQLHOST || 'localhost', // إضافة قيمة افتراضية للتطوير المحلي
      // port: parseInt(process.env.MYSQLPORT, 10) || 3306,
      // username: process.env.MYSQLUSER || 'LOAI',
      // password: process.env.MYSQLPASSWORD || '1234',
      // database: process.env.MYSQLDATABASE || 'FREELANCER_DB',
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // autoLoadEntities: true,
      // synchronize: process.env.NODE_ENV !== 'production',
      // ssl:
      //   process.env.NODE_ENV === 'production'
      //     ? {
      //         rejectUnauthorized: true,
      //         ca: process.env.MYSQL_SSL_CA, // إضافة شهادة SSL إذا لزم الأمر
      //       }
      //     : null,
      // extra: {
      //   connectionLimit: 10, // إدارة اتصالات قاعدة البيانات
      // },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'storage'),
      serveRoot: '/storage',
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
