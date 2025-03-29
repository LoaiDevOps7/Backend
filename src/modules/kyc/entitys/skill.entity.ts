import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Job } from './job.entity';

@Entity('Skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // ربط المهارات بالأعمال التي تتطلبها
  @ManyToOne(() => Job, (job) => job.skills)
  job: Job;
}
