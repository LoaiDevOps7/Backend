import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallets.entity';
import { User } from '../users/users.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
}

@Entity('Transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column({ default: 'pending' })
  status: string; // pending, completed, failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
