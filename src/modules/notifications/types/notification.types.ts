export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
}

export interface NotificationTemplate {
  id: string;
  subject?: string;
  content: string;
  channels: NotificationChannel[];
}

export type NotificationData = {
  subject?: string;
  content?: string;
  [key: string]: any;
};