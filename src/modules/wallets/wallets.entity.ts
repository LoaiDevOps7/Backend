import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Transaction } from './transactions.entity';
import { Admin } from '../admin/admin.entity';

@Entity('Wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  balance: number;

  @Column({ default: 0 })
  availableBalance: number; // الرصيد القابل للسحب

  @Column({ default: 0 })
  pendingBalance: number; // الرصيد المعلق

  @Column()
  currency: string;

  @Column({ type: 'decimal', default: 0 })
  escrow: number;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Admin, (admin) => admin.wallet)
  @JoinColumn({ name: 'adminId' })
  admin: Admin;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
