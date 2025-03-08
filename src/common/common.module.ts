import { Module } from '@nestjs/common';
import SendGridService from './sendgrid.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ConfigService, SendGridService],
  exports: [SendGridService],
})
export class CommonModule {}
