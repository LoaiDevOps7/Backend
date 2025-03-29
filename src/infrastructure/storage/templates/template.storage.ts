import { Injectable } from '@nestjs/common';
import {
  NotificationTemplate,
  NotificationChannel,
} from '@/modules/notifications/types/notification.types';

@Injectable()
export class TemplateStorage {
  private templates: Record<string, NotificationTemplate> = {
    'schedule-email': {
      id: 'schedule-email',
      subject: '{{subject}}',
      content: '{{content}}',
      channels: [NotificationChannel.EMAIL],
    },
    'verification-email': {
      id: 'verification-email',
      subject: 'Email Verification',
      content: 'Your verification code is: {{code}}',
      channels: [NotificationChannel.EMAIL],
    },
    'reset-password-email': {
      id: 'reset-password-email',
      subject: 'Reset Password',
      content: 'Your reset password code is: {{resetCode}}',
      channels: [NotificationChannel.EMAIL],
    },
    'bid-accepted-freelancer': {
      id: 'bid-accepted-freelancer',
      subject: 'تم قبول عرضك لمشروع {{projectName}}',
      content:
        '<h1>مرحباً {{freelancerFirstName}} {{freelancerLastName}}</h1><p>تم قبول عرضك في مشروع {{projectName}} من قبل صاحب المشروع. تهانينا!</p>',
      channels: [NotificationChannel.EMAIL],
    },
    'refund-processed': {
      id: 'refund-processed',
      subject: 'Refund Processed Successfully',
      content:
        '<h1>Your refund for transaction {{transactionId}} has been processed.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    'funds-transferred-to-site': {
      id: 'funds-transferred-to-site',
      subject: 'Funds Transferred to Site Account',
      content:
        '<h1>{{amount}} {{currency}} has been successfully transferred to the site account.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    'funds-transferred-to-freelancer': {
      id: 'funds-transferred-to-freelancer',
      subject: 'Funds Transferred to Freelancer',
      content:
        '<h1>{{amount}} {{currency}} has been successfully transferred to freelancer {{freelancerName}}.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    'funds-deducted': {
      id: 'funds-deducted',
      subject: 'Funds Deducted from Your Wallet',
      content:
        '<h1>{{amount}} {{currency}} has been deducted from your wallet.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    'funds-added': {
      id: 'funds-added',
      subject: 'Funds Added to Your Wallet',
      content:
        '<h1>{{amount}} {{currency}} has been added to your wallet.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    // قالب إنشاء المحفظة الجديد
    wallet_created: {
      id: 'wallet_created',
      subject: 'Wallet Created Successfully',
      content:
        '<h1>Your wallet has been created with {{currency}} as the base currency.</h1>',
      channels: [NotificationChannel.EMAIL],
    },
    'verification-approved': {
      id: 'verification-approved',
      subject: 'تم توثيق حسابك بنجاح',
      content:
        '<h1>مرحباً {{name}}</h1><p>تم توثيق حسابك بنجاح. يمكنك الآن الاستمتاع بخدماتنا.</p>',
      channels: [NotificationChannel.EMAIL],
    },
    'verification-rejected': {
      id: 'verification-rejected',
      subject: 'رفض توثيق حسابك',
      content:
        '<h1>مرحباً {{name}}</h1><p>نأسف، تم رفض توثيق حسابك. يرجى مراجعة المعلومات المقدمة أو التواصل مع الدعم.</p>',
      channels: [NotificationChannel.EMAIL],
    },
  };

  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates[id];
  }
}
