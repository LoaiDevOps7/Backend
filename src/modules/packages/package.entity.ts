import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subscription } from '../subscriptions/subscription.entity';

@Entity('Packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column()
  duration: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  features: string[];

  @OneToMany(() => Subscription, (subscription) => subscription.package)
  subscriptions: Subscription[];
}
