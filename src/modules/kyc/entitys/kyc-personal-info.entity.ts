import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { Job } from './job.entity';

@Entity('kyc_personal_info')
export class KycPersonalInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.personalInfo)
  @JoinColumn()
  user: User;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  username: string;

  @Column()
  profileImage: string;

  @Column({ type: 'datetime' })
  dateOfBirth: Date;

  @Column()
  description: string;

  // ربط المستخدم بالمهنة التي يعمل بها
  @ManyToOne(() => Job, (job) => job.id, {
    nullable: true,
  })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column()
  city: string;

  @Column()
  country: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
