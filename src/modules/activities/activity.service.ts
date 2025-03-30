import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class ActivityService {
  private redisClient: Redis.Redis;

  constructor() {
    // 1. استخدام REDIS_URL من متغيرات البيئة
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // 2. تكوين اتصال Redis مع إعدادات Railway
    this.redisClient = new Redis.default(redisUrl, {
      // 3. إضافة إعدادات TLS للإنتاج
      tls:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false, // مطلوب لتجاوز أخطاء الشهادة في Railway
            }
          : undefined,
      // 4. إعدادات إضافية لتحسين الموثوقية
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async updateUserActivity(userId: number): Promise<void> {
    await this.redisClient.set(
      `user_activity:${userId}`,
      Date.now().toString(),
      'EX',
      86400, // انتهاء تلقائي بعد 24 ساعة
    );
  }

  async checkInactiveUsers(inactiveThreshold: number): Promise<string[]> {
    // 5. استخدام SCAN بدلاً من KEYS للحصول على أداء أفضل
    let cursor = '0';
    const inactiveUsers: string[] = [];

    do {
      const reply = await this.redisClient.scan(
        cursor,
        'MATCH',
        'user_activity:*',
        'COUNT',
        100,
      );
      cursor = reply[0];

      for (const key of reply[1]) {
        const lastActiveStr = await this.redisClient.get(key);
        const lastActive = parseInt(lastActiveStr || '0', 10);
        if (Date.now() - lastActive > inactiveThreshold) {
          inactiveUsers.push(key.replace('user_activity:', ''));
          await this.redisClient.del(key);
        }
      }
    } while (cursor !== '0');

    return inactiveUsers;
  }
}
