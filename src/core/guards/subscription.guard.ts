import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from '@/modules/subscriptions/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user.sub;
    const isActive =
      await this.subscriptionService.isSubscriptionActive(userId);
    if (!isActive) {
      throw new ForbiddenException('Forbidden resource: Subscription inactive');
    }
    return true;
  }
}
