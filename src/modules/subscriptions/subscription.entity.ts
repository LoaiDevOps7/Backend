import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Package } from '../packages/package.entity';
import { User } from '../users/users.entity';

@Entity('Subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Package, (pkg) => pkg.subscriptions)
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: 'active' })
  status: string;

  @Column('boolean', { default: false })
  notified: boolean;
}
