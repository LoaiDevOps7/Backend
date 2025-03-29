import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Project } from '../projects/projects.entity';

@Entity('Contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isSigned: boolean;

  @ManyToOne(() => User)
  freelancer: User;

  @ManyToOne(() => Project, (project) => project.contract)
  @JoinColumn()
  project: Project;

  @Column({ type: 'json', nullable: true })
  signatures: {
    owner: string;
    freelancer: string;
    signedAt: Date;
  };
}
