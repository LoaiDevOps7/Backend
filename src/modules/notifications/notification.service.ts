import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationTemplate,
  NotificationStatus,
} from './types/notification.types';
import { EmailService } from './providers/email.service';
import { SmsService } from './providers/sms.service';
import { PushService } from './providers/push.service';
import { TemplateStorage } from '@/infrastructure/storage/templates/template.storage';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { Message } from '../chats/message.entity';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateStorage: TemplateStorage,
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async sendPrivateNotification(
    userId: number,
    message: string,
  ): Promise<void> {
    this.notificationGateway.handlePrivateNotification(userId, message);
  }

  async sendPublicNotification(message: string): Promise<void> {
    this.notificationGateway.handlePublicNotification(message);
  }

  private validateChannels(channels: NotificationChannel[]): void {
    const supportedChannels = Object.values(NotificationChannel);
    for (const channel of channels) {
      if (!supportedChannels.includes(channel)) {
        throw new Error(`Unsupported channel: ${channel}`);
      }
    }
  }

  sendMessageNotification(
    senderId: string,
    recipientId: string,
    message: Message,
  ) {
    this.notificationGateway.sendMessageNotification(
      senderId,
      recipientId,
      message,
    );
  }

  async sendNotification(
    templateId: string,
    recipient: string,
    data?: Record<string, any>,
    channels?: NotificationChannel[],
    stopOnFailure = true,
  ): Promise<Notification> {
    const template = this.templateStorage.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const notificationChannels = channels || template.channels;
    this.validateChannels(notificationChannels);

    const notification = new Notification();
    notification.templateId = templateId;
    notification.recipient = recipient;
    notification.data = data;
    notification.channels = notificationChannels;
    notification.status = NotificationStatus.PENDING;

    const savedNotification =
      await this.notificationRepository.save(notification);

    try {
      for (const channel of notification.channels) {
        try {
          await this.sendViaChannel(channel, template, recipient, data);
        } catch (error) {
          this.logger.error(
            `Failed to send notification via ${channel}: ${error.message}`,
            error.stack,
          );
          if (stopOnFailure) {
            throw error;
          }
        }
      }
      savedNotification.status = NotificationStatus.SENT;
    } catch (error) {
      savedNotification.status = NotificationStatus.FAILED;
      savedNotification.error = error.message;
      this.logger.error(`Notification failed: ${error.message}`, error.stack);
    }

    return this.notificationRepository.save(savedNotification);
  }

  private async sendViaChannel(
    channel: NotificationChannel,
    template: NotificationTemplate,
    recipient: string,
    data: Record<string, any>,
  ) {
    const content = this.replacePlaceholders(template.content, data);
    const subject = template.subject
      ? this.replacePlaceholders(template.subject, data)
      : undefined;

    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailService.sendEmail(recipient, subject, content);
      case NotificationChannel.SMS:
        return this.smsService.sendSms(recipient, content);
      case NotificationChannel.PUSH:
        return this.pushService.sendInSiteNotification(recipient, content);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private replacePlaceholders(text: string, data: Record<string, any>): string {
    return text.replace(/{{\s*(\w+)\s*}}/g, (match, key) => data[key] || match);
  }

  async sendRealTimeNotification(
    userId: number,
    message: string,
  ): Promise<void> {
    if (!userId || !message) {
      throw new Error('userId and message are required');
    }

    try {
      this.notificationGateway.handleNotification({ userId, message });
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private prepareNotificationData(template: any, data?: Record<string, any>) {
    return {
      ...data,
      subject: this.replacePlaceholders(template.subject, data),
      content: this.replacePlaceholders(template.content, data),
    };
  }

  async scheduleNotification(
    templateId: string,
    recipient: string,
    scheduledAt: Date,
    data?: Record<string, any>,
    visibility?: 'public' | 'private',
    userId?: number,
    channels?: NotificationChannel[],
  ): Promise<Notification> {
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    if (!scheduledAt || isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('تاريخ الجدولة غير صالح');
    }

    const template = this.templateStorage.getTemplate(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const notificationData = this.prepareNotificationData(template, data);

    if (visibility === 'private') {
      const user = await this.userService.findById(userId);
      recipient = user.email;
    } else {
      recipient = 'all'; // أو أي قيمة افتراضية للإشعارات العامة
    }

    const notification = new Notification();
    notification.templateId = templateId;
    notification.recipient = recipient;
    notification.visibility = visibility;
    notification.userId = userId;
    notification.data = notificationData;
    notification.channels = channels || [NotificationChannel.EMAIL];
    notification.scheduledAt = scheduledAt;
    notification.status = NotificationStatus.SCHEDULED;

    return this.notificationRepository.save(notification);
  }

  async getAllNotification() {
    return this.notificationRepository.find();
  }
}
