import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { EmailService } from './providers/email.service';
import { SmsService } from './providers/sms.service';
import { PushService } from './providers/push.service';
import { TemplateStorage } from '@/infrastructure/storage/templates/template.storage';
import { NotificationGateway } from './notification.gateway';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { PackageModule } from '../packages/package.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { StatisticsService } from './statistics.service';
import { UserModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    SubscriptionModule,
    PackageModule,
    UserModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationRepository,
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    TemplateStorage,
    NotificationGateway,
    ScheduledNotificationsService,
    StatisticsService,
  ],
  exports: [
    EmailService,
    SmsService,
    PushService,
    NotificationService,
    NotificationRepository,
  ],
})
export class NotificationModule {}
