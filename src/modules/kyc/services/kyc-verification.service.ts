import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycVerification } from '../entitys/kyc-verification.entity';
import {
  CreateKycVerificationDto,
  VerificationStatus,
} from '../dto/create-kyc-verification.dto';
import { UpdateKycVerificationDto } from '../dto/update-kyc-verification.dto';
import { unlink } from 'fs/promises';
import { NotificationChannel } from '@/modules/notifications/types/notification.types';
import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class KycVerificationService {
  constructor(
    @InjectRepository(KycVerification)
    private readonly verificationRepository: Repository<KycVerification>,
    private readonly notificationService: NotificationService,
  ) {}

  async createVerification(
    userId: number,
    createKycVerificationDto: CreateKycVerificationDto,
  ): Promise<KycVerification> {
    const verification = this.verificationRepository.create({
      ...createKycVerificationDto,
      user: { id: userId },
    });
    return await this.verificationRepository.save(verification);
  }

  async getVerification(userId: number): Promise<KycVerification> {
    const verification = await this.verificationRepository.findOne({
      relations: ['user', 'user.kycVerification', 'user.personalInfo'],
      where: { user: { id: userId } },
    });
    if (!verification) {
      throw new NotFoundException('لم يتم العثور على توثيق الهوية');
    }
    return verification;
  }

  async getAllVerification(): Promise<KycVerification[]> {
    return this.verificationRepository.find({
      relations: ['user', 'user.personalInfo'],
    });
  }

  async updateVerificationStatus(
    userId: number,
    verificationStatus: string,
  ): Promise<KycVerification> {
    // التأكد من أن verificationStatus موجودة
    if (!verificationStatus) {
      throw new BadRequestException('يجب توفير قيمة verificationStatus');
    }

    const kyc = await this.verificationRepository.findOne({
      relations: ['user.personalInfo'],
      where: { user: { id: userId } },
    });

    if (!kyc) {
      throw new NotFoundException('لم يتم العثور على بيانات التوثيق');
    }

    // تحويل الحالة إلى أحرف صغيرة للتحقق من مطابقتها مع القيم المسموح بها
    const normalizedStatus = verificationStatus.toLowerCase();
    const allowedStatuses = Object.values(VerificationStatus) as string[];

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException('حالة التوثيق غير صالحة');
    }

    kyc.verificationStatus = normalizedStatus as VerificationStatus;

    // إذا كانت الحالة APPROVED أو REJECTED، نرسل إشعاراً مناسباً
    if (
      normalizedStatus === VerificationStatus.APPROVED ||
      normalizedStatus === VerificationStatus.REJECTED
    ) {
      const templateId =
        normalizedStatus === VerificationStatus.APPROVED
          ? 'verification-approved'
          : 'verification-rejected';
      const notificationData = { name: kyc.user.personalInfo.firstName };

      await Promise.all([
        this.notificationService.sendNotification(
          templateId,
          kyc.user.email,
          notificationData,
          [NotificationChannel.EMAIL],
        ),
        this.notificationService.sendNotification(
          templateId,
          kyc.user.id.toString(),
          notificationData,
          [NotificationChannel.PUSH],
        ),
      ]);
    }
    // تحديث حالة التوثيق أو حذف السجل بناءً على الحالة
    if (normalizedStatus === VerificationStatus.APPROVED) {
      kyc.verificationStatus = VerificationStatus.APPROVED;
      return await this.verificationRepository.save(kyc);
    } else if (normalizedStatus === VerificationStatus.REJECTED) {
      await this.deleteVerificationAndImages(userId);
      await this.verificationRepository.delete({ id: kyc.id });
      return null;
    }
    return await this.verificationRepository.save(kyc);
  }

  async deleteVerificationAndImages(userId: number): Promise<void> {
    // استرجاع// حذف الصور والبيانات المرتبطة قبل حذف السجل سجل التوثيق للمستخدم
    const verification = await this.verificationRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!verification) {
      throw new NotFoundException('لم يتم العثور على بيانات التوثيق');
    }
    // حذف الصور إذا وُجدت
    if (verification.faceImage) {
      try {
        await unlink(verification.faceImage);
      } catch (err) {
        console.error('فشل حذف صورة الوجه:', err);
      }
    }
    if (verification.frontIdCardImage) {
      try {
        await unlink(verification.frontIdCardImage);
      } catch (err) {
        console.error('فشل حذف صورة البطاقة الأمامية:', err);
      }
    }
    if (verification.backIdCardImage) {
      try {
        await unlink(verification.backIdCardImage);
      } catch (err) {
        console.error('فشل حذف صورة البطاقة الخلفية:', err);
      }
    }
    // حذف السجل من قاعدة البيانات
    await this.verificationRepository.delete({ user: { id: userId } });
  }

  async updateVerification(
    userId: number,
    updateKycVerificationDto: UpdateKycVerificationDto,
  ): Promise<KycVerification> {
    const verification = await this.getVerification(userId);
    const updatedVerification = Object.assign(
      verification,
      updateKycVerificationDto,
    );
    updatedVerification.verificationStatus = VerificationStatus.PENDING;
    return await this.verificationRepository.save(updatedVerification);
  }
}
