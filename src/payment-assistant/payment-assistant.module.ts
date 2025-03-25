import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargesModule } from 'src/charges/charges.module';
import { PaymentAssistantService } from './payment-assistant.service';
import { PaymentAssistantController } from './payment-assistant.controller';

@Module({
  controllers: [PaymentAssistantController],
  providers: [PaymentAssistantService, ConfigService],
  imports: [ChargesModule],
})
export class PaymentAssistantModule {}
