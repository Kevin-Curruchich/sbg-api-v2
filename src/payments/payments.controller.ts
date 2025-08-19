import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Response } from 'express';

import User from 'src/auth/interfaces/user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import { PaymentsService } from './payments.service';

import {
  CreateStudentAutomatizedPaymentDto,
  CreateStudentPaymentDto,
  CreateStudentsPaymentDto,
} from './dto/create-student-payment.dto';
import { GetStudentPaymentsDto } from './dto/get-student-payments.dto';
import { GetPaymentQueryDto } from './dto/get-payment-query.dto';
import { GetStudentsPaymentsReportsDto } from './dto/get-student-payments-reports.dto';

@Controller('payments')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createStudentPayment(@Body() createPaymentDto: CreateStudentPaymentDto) {
    return this.paymentsService.createStudentPayment(createPaymentDto);
  }

  @Post('automatized')
  createAutomatizedPayment(
    @Body() createPaymentDto: CreateStudentAutomatizedPaymentDto,
  ) {
    return this.paymentsService.createAutomatizedPayment(createPaymentDto);
  }

  @Post('spread-student-positive-balance/:studentId')
  spreadStudentPositiveBalanceToCharges(@Param('studentId') studentId: string) {
    return this.paymentsService.spreadStudentPositiveBalanceToCharges(
      studentId,
    );
  }

  @Post('students')
  createPaymentsForStudents(
    @Body() createPaymentDto: CreateStudentsPaymentDto,
  ) {
    return this.paymentsService.createPaymentsForStudents(createPaymentDto);
  }

  @Get()
  getAllPayments(
    @Query() queryParams: GetStudentPaymentsDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.getAllPayments(queryParams, user);
  }

  @Get('report')
  async downloadPaymentsReport(
    @Res() res: Response,
    @Query('program_id') paymentReportsDto: GetStudentsPaymentsReportsDto,
  ) {
    const excelBuffer =
      await this.paymentsService.generatePaymentsExcelReport(paymentReportsDto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=payments_report.xlsx',
    );
    res.send(excelBuffer);
  }

  @Get(':paymentId')
  findOne(
    @Param('paymentId') paymentId: string,
    @Query() queryParams: GetPaymentQueryDto,
  ) {
    return this.paymentsService.getPaymentById(paymentId, queryParams);
  }

  @Delete(':paymentId')
  removePayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.removePaymentById(paymentId);
  }
}
