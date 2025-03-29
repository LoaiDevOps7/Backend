import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { NotificationStatus } from './types/notification.types';
import { LessThanOrEqual } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Notification } from './entities/notification.entity';

@Injectable()
export class ScheduledNotificationsService {
  private readonly logger = new Logger(ScheduledNotificationsService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationRepository: NotificationRepository,
    private readonly userService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    this.logger.debug('Checking for scheduled notifications...');
    const now = new Date();
    const notifications = await this.notificationRepository.find({
      where: {
        scheduledAt: LessThanOrEqual(now),
        status: NotificationStatus.SCHEDULED,
      },
    });

    for (const notification of notifications) {
      try {
        if (
          !notification.scheduledAt ||
          isNaN(notification.scheduledAt.getTime())
        ) {
          throw new Error(
            `Invalid scheduledAt for notification ${notification.id}`,
          );
        }

        await this.processNotification(notification);
        notification.status = NotificationStatus.SENT;
      } catch (error) {
        this.handleError(notification, error);
      }

      await this.notificationRepository.save(notification);
    }
  }

  private async processNotification(notification: Notification) {
    this.validateNotificationData(notification);

    if (notification.visibility === 'public') {
      await this.sendPublicNotification(notification);
    } else {
      await this.sendPrivateNotification(notification);
    }
  }

  private async sendPublicNotification(notification: Notification) {
    const users = await this.userService.getAllUsers();
    for (const user of users) {
      await this.notificationService.sendNotification(
        notification.templateId,
        user.email,
        notification.data,
        notification.channels,
      );
    }
  }

  private async sendPrivateNotification(notification: Notification) {
    const user = await this.userService.findById(notification.userId);
    await this.notificationService.sendNotification(
      notification.templateId,
      user.email,
      notification.data,
      notification.channels,
    );
  }

  private validateNotificationData(notification: Notification) {
    if (typeof notification.data === 'string') {
      try {
        notification.data = JSON.parse(notification.data);
      } catch (error) {
        this.logger.error(
          `Invalid JSON data in notification ${notification.id}`,
        );
        notification.data = {};
      }
    }
  }

  private handleError(notification: Notification, error: Error) {
    notification.status = NotificationStatus.FAILED;
    notification.error = error.message;
    this.logger.error(
      `Failed to send notification ${notification.id}: ${error.message}`,
    );
  }
}
