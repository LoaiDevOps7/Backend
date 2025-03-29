import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { RefreshToken } from '@/modules/auth/refresh-token.entity';
import { Message } from '@/modules/chats/message.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Bid } from '../bids/bids.entity';
import { Project } from '../projects/projects.entity';
import { Wallet } from '../wallets/wallets.entity';
import { Transaction } from '../wallets/transactions.entity';
import { Portfolio } from '../portfolios/portfolios.entity';
import { Rating } from '../ratings/ratings.entity';
import { KycPersonalInfo } from '../kyc/entitys/kyc-personal-info.entity';
import { KycVerification } from '../kyc/entitys/kyc-verification.entity';
import { ChatRoom } from '../chats/chat-room.entity';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  username: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiry: Date;

  @Column('simple-array')
  roles: string[];

  @Column({ default: 5 }) // الحد اليومي الافتراضي للتقديمات
  remainingBids: number;

  @Column({ type: 'date', nullable: true }) // تاريخ آخر إعادة ضبط للتقديمات
  lastBidReset: string;

  @Column({ nullable: true })
  resetCode: string;

  @Column({ nullable: true, type: 'timestamp' })
  resetCodeExpiry: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @ManyToMany(() => ChatRoom, (room) => room.allowedUsers)
  allowedRooms: ChatRoom[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToOne(() => KycPersonalInfo, (personalInfo) => personalInfo.user)
  personalInfo: KycPersonalInfo;

  @OneToOne(() => KycVerification, (kycVerification) => kycVerification.user)
  kycVerification: KycVerification;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => Bid, (bid) => bid.freelancer)
  bids: Bid[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToOne(() => Portfolio, (portfolio) => portfolio.user)
  @JoinColumn()
  portfolio: Portfolio;

  // التقييمات التي قام المستخدم بإعطائها
  @OneToMany(() => Rating, (rating) => rating.rater)
  ratingsGiven: Rating[];

  // التقييمات التي تلقاها المستخدم
  @OneToMany(() => Rating, (rating) => rating.rated)
  ratingsReceived: Rating[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }
}
