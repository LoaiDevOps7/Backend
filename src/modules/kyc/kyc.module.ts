import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { KycRepository } from '@/infrastructure/repositories/kyc.repository';
import { KycPersonalInfoService } from './services/kyc-personal-info.service';
import { KycVerificationService } from './services/kyc-verification.service';
import { KycVerificationController } from './controllers/kyc-verification.controller';
import { KycPersonalInfoController } from './controllers/kyc-personalInfo.controller';
import { KycPersonalInfo } from './entitys/kyc-personal-info.entity';
import { KycVerification } from './entitys/kyc-verification.entity';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../notifications/notification.module';
import { Job } from './entitys/job.entity';
import { Skill } from './entitys/skill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycPersonalInfo, KycVerification, Job, Skill]),
    UserModule,
    JwtModule,
    NotificationModule,
  ],
  providers: [KycPersonalInfoService, KycVerificationService],
  controllers: [KycVerificationController, KycPersonalInfoController],
})
export class KycModule {}
