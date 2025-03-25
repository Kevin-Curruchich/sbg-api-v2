import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaymentAssistantService } from './payment-assistant.service';

@Controller('payment-assistant')
export class PaymentAssistantController {
  constructor(
    private readonly paymentAssistantService: PaymentAssistantService,
  ) {}

  @Get('distribute/:studentId')
  distributeStudentCredit(
    @Param('studentId') studentId: string,
    @Query('amount') amount: number,
  ) {
    return this.paymentAssistantService.distributeStudentCredit(
      studentId,
      amount,
    );
  }
}
