import { Injectable, NotFoundException } from '@nestjs/common';
import { Subscription } from './subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionRepository } from '@/infrastructure/repositories/subscription.repository';
import { PackageRepository } from '@/infrastructure/repositories/package.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly packageRepository: PackageRepository,
    private readonly userService: UsersService,
  ) {}

  async isSubscriptionActive(userId: number): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByUserId(userId);
    return !!subscription; // إرجاع true إذا كان الاشتراك موجودًا ونشطًا
  }

  // إنشاء اشتراك جديد
  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const { userId, packageId } = createSubscriptionDto;

    // التحقق من وجود المستخدم في قاعدة البيانات
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // التحقق من وجود الباقة
    const pkg = await this.packageRepository.findOne({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + pkg.duration); // إضافة عدد الأيام

    // إنشاء الاشتراك
    const subscription = this.subscriptionRepository.create({
      user: user,
      package: pkg, // ربط الباقة بالاشتراك
      status: 'active', // حالة الاشتراك
      startDate: startDate, // تاريخ بداية الاشتراك
      endDate: endDate, // تاريخ الانتهاء المحسوب
    });

    // حفظ الاشتراك في قاعدة البيانات
    return this.subscriptionRepository.save(subscription);
  }

  // استرجاع الاشتراكات الخاصة بمستخدم معين
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'package'],
    });
  }

  // استرجاع الاشتراكات النشطة
  async getActiveSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ where: { status: 'active' } });
  }

  // دالة لتحديث اشتراك
  async updateSubscription(
    subscriptionId: string,
    updateData: Partial<Subscription>,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['package'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    Object.assign(subscription, updateData);
    return this.subscriptionRepository.save(subscription);
  }

  // إلغاء الاشتراك
  async cancelSubscription(subscriptionId: number): Promise<void> {
    await this.subscriptionRepository.update(subscriptionId, {
      status: 'cancelled',
    });
  }

  // تجديد الاشتراك بإضافة مدة معينة
  async renewSubscription(
    subscriptionId: string,
    duration: number,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.endDate = new Date(
      subscription.endDate.getTime() + duration * 24 * 60 * 60 * 1000,
    );
    return this.subscriptionRepository.save(subscription);
  }

  // دالة لاسترجاع ميزات المشترك
  async getSubscriberFeatures(userId: number): Promise<string[]> {
    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByUserId(userId, {
        relations: ['package'],
      });
    if (!subscription || !subscription.package) {
      return [];
    }
    return subscription.package.features || [];
  }
}
