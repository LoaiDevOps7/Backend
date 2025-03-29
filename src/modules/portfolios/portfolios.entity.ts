import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('Portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  projectUrl: string;

  @Column()
  imageUrl: string;

  @OneToOne(() => User, (user) => user.portfolio)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
