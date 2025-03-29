import { Injectable, OnModuleInit } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(private readonly activityService: ActivityService) {}

  onModuleInit() {
    // فحص دوري كل 10 ثوانٍ للمستخدمين، مع اعتبار أن المستخدم غير نشط إذا لم ينشط خلال 30 ثانية
    setInterval(async () => {
      const inactiveUsers =
        await this.activityService.checkInactiveUsers(30000);
      if (inactiveUsers.length) {
        console.log('المستخدمون غير النشطين:', inactiveUsers);
        // يمكن هنا تنفيذ عمليات إضافية مثل إرسال إشعارات أو تحديث قاعدة بيانات
      }
    }, 10000);
  }
}
