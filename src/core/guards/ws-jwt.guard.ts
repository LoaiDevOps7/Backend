import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake?.headers?.authorization?.split(' ')[1];

    if (!token) {
      console.error('No token found in headers.');
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      client.user = payload;
      return true;
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return false;
    }
  }
}
