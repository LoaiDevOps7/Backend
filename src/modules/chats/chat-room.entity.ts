import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Message } from './message.entity';
import { Project } from '@/modules/projects/projects.entity';
import { User } from '@/modules/users/users.entity';

@Entity('ChatRooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // نوع الغرفة (مرحلة المشروع)
  @Column({
    type: 'enum',
    enum: ['introduction', 'negotiation', 'contract', 'execution'],
    default: 'introduction',
  })
  type: string;

  // حالة الغرفة (نشطة/مغلقة)
  @Column({
    type: 'enum',
    enum: ['active', 'closed'],
    default: 'active',
  })
  status: string;

  // الرسائل المرتبطة بالغرفة
  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  // المشروع المرتبط بالغرفة
  @ManyToOne(() => Project, (project) => project.chatRooms)
  project: Project;

  // المستخدمون المسموح لهم بالوصول
  @ManyToMany(() => User, (user) => user.allowedRooms)
  @JoinTable()
  allowedUsers: User[];

  // تاريخ الإنشاء
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // تاريخ الإغلاق (إذا أُغلقت)
  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}
