import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import {
  NotificationChannel,
  NotificationStatus,
} from '../types/notification.types';

@Entity('Notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  templateId?: string;

  @Column()
  recipient: string;

  @Column({ type: 'json' })
  data: Record<string, any>;

  @Column({ type: 'simple-array' })
  channels: NotificationChannel[];

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.SCHEDULED,
  })
  status: NotificationStatus;

  @Column({ nullable: true })
  error?: string;

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  visibility: 'public' | 'private';

  @Column({ nullable: true })
  userId?: number;

  @CreateDateColumn()
  createdAt: Date;
}
