import { PartialType } from '@nestjs/swagger';
import { CreatePaymentAssistantDto } from './create-payment-assistant.dto';

export class UpdatePaymentAssistantDto extends PartialType(
  CreatePaymentAssistantDto,
) {}
