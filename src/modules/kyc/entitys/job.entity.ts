import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Skill } from './skill.entity';

@Entity('Jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // ربط الوظائف بالمهارات
  @OneToMany(() => Skill, (skill) => skill.job)
  skills: Skill[];
}
