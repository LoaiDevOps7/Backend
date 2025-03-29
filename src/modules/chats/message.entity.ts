import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '@/modules/users/users.entity';

@Entity('Messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  receiver: User;

  @ManyToOne(() => ChatRoom, (room) => room.messages)
  room: ChatRoom;

  @Column()
  content: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  fileType: string;

  @Column({
    type: 'enum',
    enum: ['text', 'offer', 'contract', 'payment', 'file'],
    default: 'text',
  })
  type: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  })
  status: string;

  @Column({ default: false })
  isSystemMessage: boolean;

  @Column({ type: 'json', nullable: true })
  reactions: { userId: number; reaction: string }[];
}
