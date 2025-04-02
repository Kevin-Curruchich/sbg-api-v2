import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';

import User from 'src/auth/interfaces/user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import { PaymentsService } from './payments.service';

import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { GetStudentPaymentsDto } from './dto/get-student-payments.dto';
import { GetPaymentQueryDto } from './dto/get-payment-query.dto';

@Controller('payments')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createStudentPayment(@Body() createPaymentDto: CreateStudentPaymentDto) {
    return this.paymentsService.createStudentPayment(createPaymentDto);
  }

  @Get()
  getAllPayments(
    @Query() queryParams: GetStudentPaymentsDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.getAllPayments(queryParams, user);
  }

  @Get(':paymentId')
  findOne(
    @Param('paymentId') paymentId: string,
    @Query() queryParams: GetPaymentQueryDto,
  ) {
    return this.paymentsService.getPaymentById(paymentId, queryParams);
  }

  @Delete(':id')
  removePayment(@Param('id') id: string) {
    return this.paymentsService.removePaymentById(id);
  }
}
