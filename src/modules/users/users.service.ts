import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshToken } from '../auth/refresh-token.entity';
import { RefreshTokenRepository } from '@/infrastructure/repositories/refresh-token.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private async handleUpdateResult(result: UpdateResult): Promise<void> {
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  private async getUserById(
    userId: number,
    selectFields?: (keyof User)[],
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'subscriptions',
        'personalInfo',
        'personalInfo.job',
        'kycVerification',
        'projects',
        'bids',
        'wallet',
        'transactions',
        'portfolio',
        'ratingsGiven',
        'ratingsReceived',
      ],
      select: selectFields ?? [
        'id',
        'email',
        'isEmailVerified',
        'verificationCode',
        'verificationCodeExpiry',
        'roles',
        'remainingBids',
        'lastBidReset',
        'resetCode',
        'resetCodeExpiry',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createOrUpdateRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const user = await this.getUserById(userId, ['id']);
    await this.refreshTokenRepository.delete({
      user: { id: userId },
      revoked: false,
    });
    return this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({ token, expiresAt, user }),
    );
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const result = await this.refreshTokenRepository.update(
      { token },
      { revoked: true },
    );
    await this.handleUpdateResult(result);
  }

  async validateRefreshToken(token: string): Promise<User> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
    if (
      !refreshToken ||
      refreshToken.revoked ||
      refreshToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return refreshToken.user;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      if (
        await this.userRepository.findOne({
          where: { email: createUserDto.email },
        })
      ) {
        throw new BadRequestException('Email already exists');
      }
      return this.userRepository.save(
        this.userRepository.create(createUserDto),
      );
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateVerificationCode(
    userId: number,
    verificationCode: string,
    expiresInMinutes: number = 30,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      verificationCode,
      verificationCodeExpiry: new Date(
        Date.now() + expiresInMinutes * 60 * 1000,
      ),
    });
  }

  async verifyEmail(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.handleUpdateResult(
      await this.userRepository.update(userId, { password: hashedPassword }),
    );
  }

  async clearResetCode(userId: number): Promise<void> {
    await this.handleUpdateResult(
      await this.userRepository.update(userId, {
        resetCode: null,
        resetCodeExpiry: null,
      }),
    );
  }

  async updateUser(userId: number, updateData: Partial<User>): Promise<User> {
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update data provided');
    }
    await this.getUserById(userId, ['id']);
    await this.handleUpdateResult(
      await this.userRepository.update(userId, updateData),
    );
    return this.getUserById(userId);
  }

  async findById(userId: number): Promise<User> {
    return this.getUserById(userId);
  }

  async findOnId(userId: number): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: [
        'subscriptions',
        'personalInfo',
        'personalInfo.job',
        'kycVerification',
        'projects',
        'bids',
        'wallet',
        'transactions',
        'portfolio',
        'ratingsGiven',
        'ratingsReceived',
      ],
    });
  }

  async changeUserRole(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // التأكد من أن المستخدم لديه دور "Freelancer"
    if (!user.roles.includes('Freelancer')) {
      user.roles.push('Freelancer');
    }

    if (user.roles.includes('Owner')) {
      // إذا كان "Owner"، نقوم بإزالته
      user.roles = user.roles.filter((role) => role !== 'Owner');
    } else {
      // إذا لم يكن "Owner"، نقوم بإضافته
      user.roles.push('Owner');
    }

    return this.userRepository.save(user);
  }

  async findByIdWithSubscriptions(userId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscriptions', 'subscriptions.package'],
    });
  }

  async isUserProjectOwner(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['projects'], // تأكد من أن لديك علاقة بالمشاريع
    });

    if (!user) {
      return false;
    }

    return user.projects.length > 0;
  }
}
