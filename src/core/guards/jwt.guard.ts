import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (
      ['/api/v1/auth/register', '/api/v1/auth/verify-email'].includes(
        request.path,
      )
    ) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const token =
      request.headers.authorization?.split(' ')[1] ||
      request.cookies?.authToken;
    return token;
  }
}
