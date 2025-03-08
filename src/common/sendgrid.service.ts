import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
class SendGridService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async sendEmail(to: string, templateId: string, dynamicTemplateData: object) {
    const msg = {
      to,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL'), // Use the email address or domain you verified with SendGrid
      templateId,
      dynamicTemplateData,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
      return;
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);

      throw new Error(error);
    }
  }
}

export default SendGridService;
