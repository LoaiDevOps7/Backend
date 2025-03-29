import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';

@Entity('kyc_verification')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.kycVerification)
  @JoinColumn()
  user: User;

  @Column()
  frontIdCardImage: string;

  @Column()
  backIdCardImage: string;

  @Column()
  faceImage: string;

  @Column()
  governmentId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  verificationStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeUpdate()
  updateVerifiedAt() {
    if (this.verificationStatus === 'approved' && !this.verifiedAt) {
      this.verifiedAt = new Date();
    }
  }
}
