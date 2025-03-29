import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LessThan, IsNull } from 'typeorm';
import { RefreshTokenRepository } from '@/infrastructure/repositories/refresh-token.repository';

@Injectable()
export class TokenCleanupService {
  constructor(private refreshTokenRepo: RefreshTokenRepository) {}

  // يتم تنفيذ الوظيفة كل يوم عند منتصف الليل
  @Cron('0 0 * * *')
  async handleCron() {
    // حساب التاريخ قبل 24 ساعة من الآن
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // حذف التوكنات التي انتهت صلاحيتها قبل oneDayAgo
    // ويمكنك استخدام deletedAt للتأكد من أنها لم تُحذف سابقاً (إذا كنت تستخدم soft delete)
    const result = await this.refreshTokenRepo.delete({
      expiresAt: LessThan(oneDayAgo),
      deletedAt: IsNull(), // فقط التوكنات التي لم تُحذف بعد
    });
    console.log('تم حذف التوكنات المنتهية الصلاحية:', result.affected);
  }
}
