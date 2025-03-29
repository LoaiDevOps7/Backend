import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@/modules/auth/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
  constructor(private dataSource: DataSource) {
    super(RefreshToken, dataSource.createEntityManager());
  }

  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.findOne({
      where: { token, revoked: false },
      relations: ['user'],
    });
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.update(tokenId, { revoked: true });
  }
}
