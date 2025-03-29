import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '@/modules/users/users.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async updateVerificationCode(
    userId: number,
    code: string,
    expiry: Date,
  ): Promise<void> {
    await this.update(userId, {
      verificationCode: code,
      verificationCodeExpiry: expiry,
    });
  }
}
