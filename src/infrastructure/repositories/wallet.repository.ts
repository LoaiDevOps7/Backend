import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from '@/modules/wallets/wallets.entity';

@Injectable()
export class WalletRepository extends Repository<Wallet> {
  constructor(private dataSource: DataSource) {
    super(Wallet, dataSource.createEntityManager());
  }
}
