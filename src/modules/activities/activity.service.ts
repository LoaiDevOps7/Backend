import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class ActivityService {
  private redisClient: Redis.Redis;

  constructor() {
    // استخدم Redis.default لإنشاء الكائن
    this.redisClient = new Redis.default({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async updateUserActivity(userId: number): Promise<void> {
    await this.redisClient.set(
      `user_activity:${userId}`,
      Date.now().toString(),
    );
  }

  async checkInactiveUsers(inactiveThreshold: number): Promise<string[]> {
    const keys = await this.redisClient.keys('user_activity:*');
    const now = Date.now();
    const inactiveUsers: string[] = [];

    for (const key of keys) {
      const lastActiveStr = await this.redisClient.get(key);
      const lastActive = parseInt(lastActiveStr || '0', 10);
      if (now - lastActive > inactiveThreshold) {
        inactiveUsers.push(key.replace('user_activity:', ''));
        // يمكنك حذف المفتاح أو تحديث حالة المستخدم في قاعدة البيانات
        await this.redisClient.del(key);
      }
    }
    return inactiveUsers;
  }
}
