import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Workbook } from 'exceljs';

import { PaymentsService } from 'src/payments/payments.service';

import User from 'src/auth/interfaces/user.interface';

import { PaymentReportsDto } from './dto/payments-reports.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly paymentService: PaymentsService) {}

  async getPaymentsReports(
    queryParams: PaymentReportsDto,
    user: User,
    res: Response,
  ) {
    const responseData =
      await this.paymentService.getAllPaymentsWithoutPagination(
        queryParams,
        user,
      );

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Payments Report');

    worksheet.columns = [
      { header: 'Id', key: 'public_payment_id', width: 30 },
      { header: 'Estudiante', key: 'student_name', width: 30 },
      { header: 'Detalle Pago', key: 'payment_details', width: 30 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Metodo', key: 'payment_method', width: 20 },
      { header: 'Fecha', key: 'payment_date', width: 20 },
      { header: 'Número Referencia', key: 'reference_number', width: 20 },
    ];

    responseData.forEach((payment) => {
      if (payment.payment_details.length > 1) {
        // If there are multiple payment details, first create a row for the payment and then add details
        worksheet.addRow({
          public_payment_id: payment.public_payment_id,
          student_name:
            payment.students.first_name + ' ' + payment.students.last_name,
          payment_method: payment.payment_methods.name,
          payment_details: '', // Placeholder for details
          reference_number: payment.reference_number,
          amount: 0,
          payment_date: payment.payment_date,
        });

        // Create a row for each payment detail
        payment.payment_details.forEach((detail) => {
          worksheet.addRow({
            public_payment_id: payment.public_payment_id,
            student_name: '',
            payment_method: '',
            payment_details: detail.description, // Add individual detail description
            amount: +detail.applied_amount,
            reference_number: '',
            payment_date: '',
          });
        });
      } else {
        // If no payment details, create a single row with empty details
        worksheet.addRow({
          public_payment_id: payment.public_payment_id,
          student_name:
            payment.students.first_name + ' ' + payment.students.last_name,
          payment_method: payment.payment_methods.name,
          payment_details: payment['payment_details'][0].description, // No details available
          reference_number: payment.reference_number,
          amount: +payment.amount,
          payment_date: payment.payment_date,
        });
      }
    });

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=payments-report.xlsx',
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  }
}
