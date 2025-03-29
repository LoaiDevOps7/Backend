import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from '../decorators/features.decorator';
import { SubscriptionService } from '@/modules/subscriptions/subscription.service';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // استرجاع الميزات المطلوبة من الديكوريتور
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // إذا لم يتم تحديد ميزات مطلوبة، يسمح بالوصول
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // نفترض أن بيانات المستخدم محفوظة (مثلاً بعد التحقق بواسطة JWT)
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // استرجاع ميزات المستخدم بناءً على اشتراكه النشط
    const userFeatures = await this.subscriptionService.getSubscriberFeatures(
      user.id,
    );

    // التحقق من أن المستخدم يمتلك كل الميزات المطلوبة
    const hasAllFeatures = requiredFeatures.every((feature) =>
      userFeatures.includes(feature),
    );

    if (!hasAllFeatures) {
      throw new ForbiddenException(
        'Access denied. Required features are missing.',
      );
    }

    return true;
  }
}
