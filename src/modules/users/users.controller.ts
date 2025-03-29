import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '@/core/guards/jwt.guard';
import { User } from './users.entity';
import { UserDecorators } from '@/core/decorators/user.decorator';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('data')
  getData(@UserDecorators() user: any) {
    return user || { message: 'User not found' };
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Patch(':userId/change-role-to-owner')
  async changeRoleToOwner(@Param('userId') userId: number): Promise<User> {
    return this.usersService.changeUserRole(userId);
  }
}
