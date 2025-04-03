import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import User from 'src/auth/interfaces/user.interface';

import { ReportsService } from './reports.service';
import { PaymentReportsDto } from './dto/payments-reports.dto';

@Controller('reports')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('payments')
  async getPaymentsReports(
    @Res() res: Response,
    @Query() queryParams: PaymentReportsDto,
    @GetUser() user: User,
  ) {
    await this.reportsService.getPaymentsReports(queryParams, user, res);
  }
}
