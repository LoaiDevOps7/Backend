import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionGuard } from '@/core/guards/subscription.guard';
import { Subscription } from './subscription.entity';
import { JwtGuard } from '@/core/guards/jwt.guard';
import { FeaturesGuard } from '@/core/guards/features.guard';
import { RequiredFeatures } from '@/core/decorators/features.decorator';

@Controller('subscriptions')
@UseGuards(JwtGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // إنشاء اشتراك جديد
  @Post('create')
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(createSubscriptionDto);
  }

  // تحديث الاشتراك
  @UseGuards(SubscriptionGuard, FeaturesGuard)
  @RequiredFeatures('premiumAccess')
  @Post('update/:subscriptionId')
  update(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateData: Partial<Subscription>,
  ) {
    return this.subscriptionService.updateSubscription(
      subscriptionId,
      updateData,
    );
  }

  // إلغاء الاشتراك
  @Post('cancel/:subscriptionId')
  cancel(@Param('subscriptionId') subscriptionId: number) {
    return this.subscriptionService.cancelSubscription(subscriptionId);
  }

  // استرجاع الاشتراكات الخاصة بمستخدم معين
  @Get('subscriptions-by-user/:userId')
  getSubscriptionsByUserId(@Param('userId') userId: number) {
    return this.subscriptionService.getSubscriptionsByUserId(userId);
  }

  // استرجاع الاشتراكات النشطة
  @Post('active-subscriptions')
  getActiveSubscriptions() {
    return this.subscriptionService.getActiveSubscriptions();
  }
}
