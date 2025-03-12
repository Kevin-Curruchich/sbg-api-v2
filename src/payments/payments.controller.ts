import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createStudentPayment(@Body() createPaymentDto: CreateStudentPaymentDto) {
    return this.paymentsService.createStudentPayment(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Delete(':id')
  removePayment(@Param('id') id: string) {
    return this.paymentsService.removePaymentById(id);
  }
}
