import { Injectable } from '@nestjs/common';
import { StudentService } from 'src/students/students.service';
import * as dayjs from 'dayjs';

import User from 'src/auth/interfaces/user.interface';
import { PaymentsService } from 'src/payments/payments.service';
import { ChargesService } from 'src/charges/charges.service';

@Injectable()
export class GeneralService {
  constructor(
    private readonly studentRepository: StudentService,
    private readonly paymentsRepository: PaymentsService,
    private readonly chargesService: ChargesService,
  ) {}

  async getDashboard(user: User) {
    const programs = user.admin_programs.map((program) => program.program_id);
    const studentsCount =
      await this.studentRepository.getStudentsCount(programs);

    //generate an array of objects with dates (start and end of date) of the last three months from today. If today is 2025-04-14, the array should be: [{
    // start: 2025-02-01, end: 2025-02-28 }, {start: 2025-03-01, end: 2025-03-31 }, {start: 2025-04-01, end: 2025-04-14 }]. Use dayjs package to generate the dates.

    const today = dayjs();
    const startOfMonth = today.startOf('month');
    const endOfMonth = today.endOf('month');

    const totalPaymentsByMonth = [];
    let totalCurrentMonth = {
      start: startOfMonth.format('YYYY-MM-DD'),
      end: endOfMonth.format('YYYY-MM-DD'),
      month: startOfMonth.format('MMMM YYYY'),
      total: 0,
    };

    for (let i = 0; i < 3; i++) {
      const start = startOfMonth.subtract(i, 'month').startOf('day').format();
      const end = endOfMonth.subtract(i, 'month').endOf('day').format();

      const totalMonth = await this.paymentsRepository.totalPaymentsByMonth(
        {
          startDate: start,
          endDate: end,
        },
        programs,
      );

      totalPaymentsByMonth.push({
        start: start,
        end: end,
        month: dayjs(start).format('MMMM YYYY'),
        total: totalMonth,
      });

      if (i === 0) {
        totalCurrentMonth.total = totalMonth;
      }
    }

    const collectionRate = await this.chargesService.getPaymentCollectionRate(
      programs,
      {
        start: startOfMonth.toDate(),
        end: endOfMonth.toDate(),
      },
    );

    return {
      studentsCount,
      totalPaymentsByMonth,
      totalCurrentMonth,
      collectionRate,
    };
  }
}
