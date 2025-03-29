import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Category } from '../categories/categories.entity';
import { User } from '../users/users.entity';
import { Bid } from '../bids/bids.entity';
import { ChatRoom } from '../chats/chat-room.entity';
import { Contract } from '../chats/contract.entity';

@Entity('Projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column()
  duration: number;

  @Column()
  budget: number;

  @Column('simple-array')
  skills: string;

  // ربط المشروع بفئة معينة
  @ManyToOne(() => Category, (category) => category.projects, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // ربط المشروع بصاحبه
  @ManyToOne(() => User, (user) => user.projects, { nullable: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  // علاقة المشروع بالعروض المقدمة
  @OneToMany(() => Bid, (bid) => bid.project)
  bids: Bid[];

  // تحديد العرض المختار للمشروع
  @ManyToOne(() => Bid, (bid) => bid.project)
  @JoinColumn({ name: 'selectedBidId' })
  selectedBid: Bid;

  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.project)
  chatRooms: ChatRoom[];

  @OneToOne(() => Contract, (contract) => contract.project)
  @JoinColumn()
  contract: Contract;

  @Column({
    type: 'enum',
    enum: ['introduction', 'negotiation', 'contract', 'execution'],
    default: 'introduction',
  })
  currentStage: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
