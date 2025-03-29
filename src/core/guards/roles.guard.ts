import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/core/decorators/roles.decorator';
import { UsersService } from '@/modules/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService, // إضافة خدمة المستخدمين
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // الحصول على الأدوار المطلوبة من الـ metadata
    const requiredRoles =
      this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) || [];

    // إذا لم تكن هناك أدوار مطلوبة، اسمح بالوصول
    if (requiredRoles.length === 0) {
      return true;
    }

    // الحصول على بيانات المستخدم من الطلب
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // التحقق من وجود مستخدم مصادق عليه
    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Authentication required',
        error: 'Forbidden',
      });
    }

    // جلب بيانات المستخدم الحالية من قاعدة البيانات
    const currentUser = await this.usersService.findById(user.sub);

    // التحقق من تطابق الأدوار
    const hasRole = requiredRoles.some((role) =>
      currentUser.roles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Required roles: ${requiredRoles.join(', ')}`,
        error: 'Forbidden',
      });
    }

    return true;
  }
}
