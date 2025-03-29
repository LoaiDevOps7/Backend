import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // تحقق من صلاحية الأدمن؛ يجب تعديل هذه الخاصية بحسب تطبيقك
    if (!user.isAdmin) {
      throw new UnauthorizedException('Access denied. Admins only.');
    }

    return true;
  }
}
