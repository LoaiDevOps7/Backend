import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../projects/projects.entity';
import { User } from '../users/users.entity';

@Entity('Bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  amount: number; // المبلغ المعروض

  @Column({ type: 'text' })
  description: string; // وصف العرض

  @Column({ type: 'date' })
  submittedAt: string; // تاريخ تقديم العرض

  @Column({ default: 'SPY' })
  currency: string;

  @Column()
  deliveryTime: number;

  // ربط العرض بالمشروع
  @ManyToOne(() => Project, (project) => project.bids, { nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // ربط العرض بالمستقل
  @ManyToOne(() => User, (user) => user.bids, { nullable: false })
  @JoinColumn({ name: 'freelancerId' })
  freelancer: User;

  // ربط العرض بالمالك
  @ManyToOne(() => User, (user) => user.bids, { nullable: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ default: 'pending' })
  status: string; // حالة العرض: معلق أو مقبول أو مرفوض
}
