import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RefreshToken } from '../auth/refresh-token.entity';
import { Wallet } from '../wallets/wallets.entity';


@Entity('Admin')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'simple-array' })
  roles: string[];

  @OneToOne(() => Wallet, (wallet) => wallet.admin)
  wallet: Wallet;

  @OneToMany(() => RefreshToken, (token) => token.admin)
  refreshTokens: RefreshToken[];
}
