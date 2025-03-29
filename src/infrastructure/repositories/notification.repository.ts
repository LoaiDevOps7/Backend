import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { NotificationStatus } from '@/modules/notifications/types/notification.types';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  // البحث عن الإشعارات المجدولة
  async findScheduledNotifications(): Promise<Notification[]> {
    return this.createQueryBuilder('notification')
      .where('notification.scheduledAt <= :now', { now: new Date() })
      .andWhere('notification.status = :status', {
        status: NotificationStatus.PENDING,
      })
      .getMany();
  }

  // البحث عن الإشعارات المرسلة
  async findSentNotifications(): Promise<Notification[]> {
    return this.find({ where: { status: NotificationStatus.SENT } });
  }

  // البحث عن الإشعارات الفاشلة
  async findFailedNotifications(): Promise<Notification[]> {
    return this.find({ where: { status: NotificationStatus.FAILED } });
  }

  // حذف الإشعارات القديمة
  async deleteOldNotifications(days: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    await this.createQueryBuilder('notification')
      .delete()
      .where('notification.createdAt < :date', { date })
      .execute();
  }
}
