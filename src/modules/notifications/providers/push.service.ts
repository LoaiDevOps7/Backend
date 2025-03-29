import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../notification.gateway';

@Injectable()
export class PushService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  async sendInSiteNotification(userId: string, message: string): Promise<void> {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid userId');
    }
    return this.notificationGateway.handlePrivateNotification(
      numericUserId,
      message,
    );
  }
}
