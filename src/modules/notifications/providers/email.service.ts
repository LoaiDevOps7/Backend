import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo, Options } from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<SentMessageInfo, Options>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.transporter.verify((error: any, success: any) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Server is ready to send emails:', success);
      }
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
      });
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error; // إعادة رمي الخطأ للتعامل معه في الطبقات الأعلى
    }
  }
}
