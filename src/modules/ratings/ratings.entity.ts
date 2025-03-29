import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('Ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // معرف المستخدم الذي يقوم بالتقييم
  @ManyToOne(() => User, (user) => user.ratingsGiven)
  @JoinColumn({ name: 'raterId' }) // سيتم تخزين المفتاح الخارجي في عمود raterId
  rater: User;

  // دور المستخدم الذي يقوم بالتقييم (مثال: 'owner' أو 'freelancer')
  @Column()
  raterRole: string;

  // معرف المستخدم الذي يتم تقييمه
  @ManyToOne(() => User, (user) => user.ratingsReceived)
  @JoinColumn({ name: 'ratedId' }) // سيتم تخزين المفتاح الخارجي في عمود ratedId
  rated: User;

  // دور المستخدم الذي يتم تقييمه (مثال: 'owner' أو 'freelancer')
  @Column()
  ratedRole: string;

  // معرف المشروع المرتبط بالتقييم
  @Column()
  projectId: string;

  // معايير التقييم الأساسية (1-5)
  // @Column({ type: 'int' })
  // ratingSpeed: number;

  @Column({ type: 'int' })
  ratingProfessionalism: number;

  // @Column({ type: 'int' })
  // ratingResponse: number;

  // معايير تقييم إضافية (اختيارية)
  @Column({ type: 'int' })
  ratingQuality: number;

  @Column({ type: 'int' })
  ratingTimeliness: number;

  @Column({ type: 'int' })
  ratingCommunication: number;

  // معايير جديدة
  @Column({ type: 'int' })
  ratingExpertise: number; // الخبرة بالمجال

  @Column({ type: 'int' })
  ratingRepeat: number; // معاودة التعامل

  // // اقتراحات للتحسين (ملاحظات إضافية)
  // @Column({ type: 'text' })
  // improvementSuggestions?: string;

  // تعليق عام
  @Column({ type: 'text' })
  comment: string;

  // نسبة الالتزام بالمواعيد (مثلاً: 95 يعني 95%)
  // @Column({ type: 'float', nullable: true })
  // timelinessPercentage?: number;

  // نظام تقييم تفصيلي: مثال { execution: 4, delivery: 5, postDeliverySupport: 3 }
  // @Column({ type: 'json', nullable: true })
  // detailedRatings?: {
  //   execution?: number;
  //   delivery?: number;
  //   postDeliverySupport?: number;
  // };

  @CreateDateColumn()
  createdAt: Date;
}
