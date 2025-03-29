import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Themes')
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  primaryColor: string;

  @Column()
  secondaryColor: string;

  @Column()
  backgroundColor: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  logoUrl: string; // شعار الموقع

  @Column({ nullable: true })
  homeIcon: string; // أيقونة الرئيسية

  @Column({ nullable: true })
  profileIcon: string; // أيقونة البروفايل

  @Column({ nullable: true })
  settingsIcon: string; // أيقونة الإعدادات
}
