import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendSms(to: string, body: string): Promise<void> {
    await this.client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
      to,
    });
  }
}
