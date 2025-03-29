import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '@/modules/wallets/transactions.entity';

@Injectable()
export class TransactionRepository extends Repository<Transaction> {
  constructor(private dataSource: DataSource) {
    super(Transaction, dataSource.createEntityManager());
  }
}
