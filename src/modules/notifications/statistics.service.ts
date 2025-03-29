import { Injectable } from '@nestjs/common';
import {
  NotificationStatus,
  NotificationChannel,
} from './types/notification.types';
import { NotificationRepository } from '@/infrastructure/repositories/notification.repository';
import { SubscriptionRepository } from '@/infrastructure/repositories/subscription.repository';
import { PackageRepository } from '@/infrastructure/repositories/package.repository';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly packageRepository: PackageRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async getStatistics(): Promise<{
    total: number;
    sent: number;
    failed: number;
    byChannel: Record<NotificationChannel, number>;
  }> {
    const total = await this.notificationRepository.count();
    const sent = await this.notificationRepository.count({
      where: { status: NotificationStatus.SENT },
    });
    const failed = await this.notificationRepository.count({
      where: { status: NotificationStatus.FAILED },
    });

    const byChannel = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('channel, COUNT(*) as count')
      .groupBy('channel')
      .getRawMany();

    return {
      total,
      sent,
      failed,
      byChannel: byChannel.reduce(
        (acc, { channel, count }) => {
          acc[channel] = count;
          return acc;
        },
        {} as Record<NotificationChannel, number>,
      ),
    };
  }

  async getPackageStatistics(): Promise<any> {
    const totalPackages = await this.packageRepository.count();
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { status: 'active' },
    });

    return {
      totalPackages,
      activeSubscriptions,
    };
  }
}
