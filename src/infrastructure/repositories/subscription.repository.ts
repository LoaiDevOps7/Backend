import { DataSource, Repository } from 'typeorm';
import { Subscription } from '@/modules/subscriptions/subscription.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionRepository extends Repository<Subscription> {
  constructor(private dataSource: DataSource) {
    super(Subscription, dataSource.createEntityManager());
  }

  async findActiveSubscriptionByUserId(
    userId: number,
    options?: { relations?: string[] },
  ): Promise<Subscription | undefined> {
    return this.findOne({
      where: {
        user: { id: userId },
        status: 'active',
      },
      relations: options?.relations ?? [],
    });
  }

  // دالة لإنشاء اشتراك جديد
  async createSubscription(
    subscriptionData: Partial<Subscription>,
  ): Promise<Subscription> {
    const subscription = this.create(subscriptionData);
    return await this.save(subscription);
  }

  // دالة لتحديث اشتراك
  async updateSubscription(
    subscriptionId: string,
    updateData: Partial<Subscription>,
  ): Promise<Subscription> {
    await this.update(subscriptionId, updateData);
    return this.findOne({ where: { id: subscriptionId } });
  }

  // دالة لإلغاء الاشتراك
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    subscription.status = 'cancelled'; // تحديث الحالة إلى "مُلغى"
    return this.save(subscription);
  }

  // دالة للبحث عن جميع الاشتراكات
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.find();
  }
}
