import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorators = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Extracted User:', request.user);
    return request.user;
  },
);
