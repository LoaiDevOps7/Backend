import { Controller, Post, Body, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './types/notification.types';
import { StatisticsService } from './statistics.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly statisticsService: StatisticsService,
  ) {}

  @Post()
  async createNotification(
    @Body()
    body: {
      templateId: string;
      recipient: string;
      data?: Record<string, any>;
      channels?: NotificationChannel[];
    },
  ) {
    return this.notificationService.sendNotification(
      body.templateId,
      body.recipient,
      body.data,
      body.channels,
    );
  }

  @Post('public')
  async sendPublic(@Body() body: { message: string }) {
    await this.notificationService.sendPublicNotification(body.message);
    return { status: 'Public notification sent' };
  }

  @Post('private')
  async sendPrivate(@Body() body: { userId: number; message: string }) {
    await this.notificationService.sendPrivateNotification(
      body.userId,
      body.message,
    );
    return { status: 'Private notification sent' };
  }

  @Get('statistics')
  async getStatistics() {
    return this.statisticsService.getStatistics();
  }

  @Post('schedule')
  async scheduleNotification(
    @Body()
    body: {
      templateId?: string;
      recipient?: string;
      scheduledAt: string;
      data?: Record<string, any>;
      visibility: 'public' | 'private';
      userId?: number;
      channels?: NotificationChannel[];
    },
  ) {
    const scheduledAt = new Date(body.scheduledAt);
    if (body.visibility === 'private' && !body.userId) {
      throw new Error('userId is required for private notifications');
    }
    if (body.visibility === 'public') {
      body.recipient = 'all'; // تجاهل القيمة أو تعيين قيمة افتراضية
    }
    return this.notificationService.scheduleNotification(
      body.templateId,
      body.recipient,
      scheduledAt,
      body.data,
      body.visibility,
      body.userId,
      body.channels,
    );
  }

  @Get('get/schedule')
  async getAllNotification() {
    return this.notificationService.getAllNotification();
  }
}
