import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/users.entity';
import { Admin } from '../admin/admin.entity';

@Entity('RefreshTokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @Index()
  user: User;

  @ManyToOne(() => Admin, (admin) => admin.refreshTokens)
  @Index()
  admin: Admin;
}
