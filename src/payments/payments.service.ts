import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

import * as dayjs from 'dayjs';

import User from 'src/auth/interfaces/user.interface';

// import SendGridService from '../common/sendgrid.service';
// import { StudentService } from 'src/students/students.service';
import { ChargesService } from '../charges/charges.service';

import { PaymentsRepository } from './payments.repository';

import { ChargeStatuses } from 'src/common/constants/charge-status.constant';

import {
  CreateStudentAutomatizedPaymentDto,
  CreateStudentPaymentDto,
  CreateStudentsPaymentDto,
} from './dto/create-student-payment.dto';
import { GetStudentPaymentsDto } from './dto/get-student-payments.dto';
import { GetPaymentQueryDto } from './dto/get-payment-query.dto';

import { formatCurrency } from 'src/common/helpers/currency.helper';
import { PaymentReportsDto } from 'src/reports/dto/payments-reports.dto';
import { formatDate } from 'src/common/helpers/date.helper';
import { GetStudentsPaymentsReportsDto } from './dto/get-student-payments-reports.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    // private readonly sendGridService: SendGridService,
    // private readonly studentsService: StudentService,
    // private readonly configService: ConfigService,
    private readonly chargesService: ChargesService,
  ) {}

  async createStudentPayment(createPaymentDto: CreateStudentPaymentDto) {
    const paymentCreated = await this.paymentsRepository.createStudentPayment({
      ...createPaymentDto,
      payment_date: dayjs(createPaymentDto.payment_date).toDate(),
    });

    //Get student charges applied to the payment and validate if each charge is paid in full or not to update the charge status
    const studentCharges = paymentCreated.payment_details.map((detail) => ({
      charge_id: detail.charges.charge_id,
      current_amount: detail.charges.current_amount,
    }));

    //update charge status
    studentCharges.forEach(async (charge) => {
      const paymentsByStudentCharge =
        await this.paymentsRepository.getPaymentsByChargeId(charge.charge_id);

      const totalAmountPaidByCharge = paymentsByStudentCharge.reduce(
        (acc, payment) => acc + Number(payment.applied_amount),
        0,
      );

      if (Number(charge.current_amount) === totalAmountPaidByCharge) {
        await this.chargesService.updateChargeStatus(charge.charge_id, {
          charge_status_id: ChargeStatuses.TOTAL_PAID,
        });
      } else {
        await this.chargesService.updateChargeStatus(charge.charge_id, {
          charge_status_id: ChargeStatuses.PENDING,
        });
      }
    });

    //send email to student
    // const student = await this.studentsService.getStudentById(
    //   createPaymentDto.student_id,
    // );

    // const paymentData = {
    //   paymentDate: dayjs(paymentCreated.payment_date).format('DD/MM/YYYY'),
    //   paymentId: paymentCreated.public_payment_id,
    //   studentFullName: `${student.first_name} ${student.last_name}`,
    //   paymentAmount: paymentCreated.amount,
    //   paymentDetails: paymentCreated.payment_details.map((detail) => ({
    //     collectionName: detail.charges.charge_types.name,
    //     paymentDescription: detail.description,
    //     paymentAmount: detail.applied_amount,
    //   })),
    // };

    // await this.sendGridService.sendEmail(
    //   student.email,
    //   this.configService.get<string>('PAYMENT_TEMPLATE_ID'),
    //   paymentData,
    // );

    return paymentCreated;
  }

  async createAutomatizedPayment(
    createPaymentDto: CreateStudentAutomatizedPaymentDto,
  ) {
    const { amount } = createPaymentDto;

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    let amountToApplyToCharges = amount;

    const studentCharges = await this.chargesService.getChargesByStudentId(
      createPaymentDto.student_id,
      {
        charge_status_id: ChargeStatuses.PENDING,
      },
    );

    if (studentCharges.length === 0) {
      throw new Error('No pending charges found for the student');
    }

    const paymentDetails = [];

    for (const charge of studentCharges) {
      if (amountToApplyToCharges <= 0) break;

      const chargeAmount = Number(charge.totalAmountDue);
      const amountToApply = Math.min(amountToApplyToCharges, chargeAmount);

      paymentDetails.push({
        charge_id: charge.charge_id,
        applied_amount: amountToApply,
        is_from_credit_balance: false,
        description: `Pago automatizado para ${charge.charge_types.name}`,
      });

      amountToApplyToCharges -= amountToApply;
    }

    return this.createStudentPayment({
      student_id: createPaymentDto.student_id,
      amount: amount,
      payment_method_id: createPaymentDto.payment_method_id,
      reference_number: createPaymentDto.reference_number,
      payment_date: createPaymentDto.payment_date,
      payment_details: paymentDetails,
    });
  }

  async spreadStudentPositiveBalanceToCharges(studentId: string) {
    const studentCharges = await this.chargesService.getChargesByStudentId(
      studentId,
      {
        charge_status_id: ChargeStatuses.PENDING,
      },
    );

    if (studentCharges.length === 0) {
      throw new Error('No pending charges found for the student');
    }

    const studentBalance =
      await this.chargesService.getStudentBalance(studentId);

    if (!studentBalance.studentHasCredit) {
      throw new Error('No positive balance to spread to charges');
    }

    let remainingBalance = studentBalance.studentCredit;

    const paymentDetails = [];

    for (const charge of studentCharges) {
      if (remainingBalance <= 0) break;

      const chargeAmount = Number(charge.totalAmountDue);
      const amountToApply = Math.min(remainingBalance, chargeAmount);

      paymentDetails.push({
        charge_id: charge.charge_id,
        applied_amount: amountToApply,
        is_from_credit_balance: true,
        description: `Saldo a favor aplicado a ${charge.charge_types.name}`,
      });

      remainingBalance -= amountToApply;
    }

    const paymentAmountApplied = paymentDetails.reduce(
      (total, detail) => total + detail.applied_amount,
      0,
    );

    const paymentCreated = await this.createStudentPayment({
      student_id: studentId,
      amount: paymentAmountApplied,
      payment_method_id: 'e9540021-dc7e-45bd-b8da-65c7d62b786f',
      reference_number: null,
      payment_date: new Date(),
      payment_details: paymentDetails,
    });

    return {
      message: 'Positive balance spread to charges successfully',
      remainingBalance,
      paymentDetails,
      paymentCreated,
    };
  }

  async createPaymentsForStudents(
    createStudentsPayment: CreateStudentsPaymentDto,
  ) {
    const paymentsToCreate = {
      ...createStudentsPayment,
      payment_date: dayjs(createStudentsPayment.payment_date).toDate(),
    };

    const paymentsCreated =
      await this.paymentsRepository.createPaymentsForStudents(paymentsToCreate);

    return paymentsCreated;
  }

  async getAllPaymentsWithoutPagination(
    queryParams: PaymentReportsDto,
    user: User,
  ) {
    const programs = user.admin_programs.map((program) => program.program_id);

    const data = await this.paymentsRepository.getAllPaymentsWithoutPagination(
      queryParams,
      programs,
    );

    const dataFormatted = data.map((payment) => ({
      ...payment,
      payment_date: dayjs(payment.payment_date).format('DD/MM/YYYY'),
      payment_details: Array.isArray(payment.payment_details)
        ? payment.payment_details.map((detail) => ({
            ...detail,
            applied_amount: formatCurrency(Number(detail.applied_amount)),
          }))
        : [],
    }));

    return dataFormatted;
  }

  async getAllPayments(
    queryParams: GetStudentPaymentsDto,
    user: User,
    settings: {
      returnPaginated: boolean;
    } = { returnPaginated: true },
  ) {
    const programs = user.admin_programs.map((program) => program.program_id);

    if (queryParams.payment_date_start) {
      queryParams.payment_date_start = dayjs(
        queryParams.payment_date_start,
      ).toDate();

      queryParams.payment_date_end = dayjs(queryParams.payment_date_end)
        .endOf('day')
        .toDate();
    }

    const { data, total } = await this.paymentsRepository.getAllPayments(
      queryParams,
      programs,
      settings,
    );

    const dataFormatted = data.map((payment) => ({
      ...payment,
      amountFormatted: formatCurrency(Number(payment.amount)),
      payment_date: dayjs(payment.payment_date).format('DD/MM/YYYY'),
      payment_details: Array.isArray(payment.payment_details)
        ? payment.payment_details.map((detail) => ({
            ...detail,
            applied_amount: formatCurrency(Number(detail.applied_amount)),
            due_date_formatted: formatDate(
              detail.charges.due_date,
              'DD/MM/YYYY',
            ),
            due_date: formatDate(detail.charges.due_date, 'YYYY-MM-DD'),
          }))
        : [],
    }));

    return { data: dataFormatted, total };
  }

  getPaymentById(id: string, queryParams: GetPaymentQueryDto) {
    return this.paymentsRepository.getPaymentById(id, queryParams);
  }

  async removePaymentById(paymentId: string) {
    const payment = await this.paymentsRepository.getPaymentById(paymentId, {
      includePaymentDetails: true,
      includeStudentData: true,
    });

    //Get student charges applied to the payment and validate if each charge is paid in full or not to update the charge status
    const studentCharges = payment.payment_details.map((detail) => ({
      charge_id: detail.charges.charge_id,
      current_amount: detail.charges.current_amount,
      payment_applied_amount: Number(detail.applied_amount),
    }));

    //update charge status
    studentCharges.forEach(async (charge) => {
      const paymentsByStudentCharge =
        await this.paymentsRepository.getPaymentsByChargeId(charge.charge_id);

      const totalAmountPaidByCharge = paymentsByStudentCharge.reduce(
        (acc, payment) => acc + Number(payment.applied_amount),
        0,
      );

      let newStatus = ChargeStatuses.TOTAL_PAID;

      if (totalAmountPaidByCharge === 0) {
        newStatus = ChargeStatuses.PENDING;
      } else if (totalAmountPaidByCharge < Number(charge.current_amount)) {
        newStatus = ChargeStatuses.PENDING;
      } else if (totalAmountPaidByCharge === Number(charge.current_amount)) {
        newStatus = ChargeStatuses.TOTAL_PAID;
      }
      await this.chargesService.updateChargeStatus(charge.charge_id, {
        charge_status_id: newStatus,
      });
    });

    // await this.sendGridService.sendEmail(
    //   payment.students.email,
    //   this.configService.get<string>('DELETE_PAYMENT_TEMPLATE_ID'),
    //   paymentData,
    // );

    return this.paymentsRepository.removePaymentById(paymentId);
  }

  async totalPaymentsByMonth(
    paymentsDates: {
      startDate: string;
      endDate: string;
    },
    programs: string[] | null,
  ) {
    return await this.paymentsRepository.totalPaymentsByMonth(
      paymentsDates,
      programs,
    );
  }

  async getPaymentsReport(filters: GetStudentsPaymentsReportsDto) {
    const payments = await this.paymentsRepository.getPaymentsReport(filters);

    return payments.map((payment) => ({
      ...payment,
      payment_date: dayjs(payment.payment_date).format('YYYY-MM-DD'),
      payment_details: payment.payment_details.map((detail) => ({
        ...detail,
        applied_amount: Number(detail.applied_amount).toFixed(2),
      })),
    }));
  }

  async generatePaymentsExcelReport(
    filters: GetStudentsPaymentsReportsDto,
  ): Promise<Buffer> {
    const payments = await this.getPaymentsReport(filters);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payments Report');

    worksheet.columns = [
      { header: 'StudentID', key: 'studentId', width: 0 },
      { header: 'Id', key: 'id', width: 30 },
      { header: 'Estudiante', key: 'studentName', width: 30 },
      { header: 'Fecha de Pago', key: 'paymentDate', width: 15 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Detalles', key: 'details', width: 50 },
      { header: 'Metodo de pago', key: 'payment_method', width: 50 },
      { header: 'Donacion', key: 'donation', width: 50 },
    ];

    payments.forEach((payment) => {
      const baseRow = {
        studentId: payment.student_id,
        id: payment.public_payment_id,
        studentName: `${payment.students.first_name} ${payment.students.last_name}`,
        paymentDate: formatDate(payment.payment_date, 'DD/MM/YYYY'),
        amount: Number(payment.amount),
        payment_method: payment.payment_methods.name,
        details:
          payment.payment_details.length > 0
            ? `${payment.payment_details[0]?.description || 'N/A'} (${payment.payment_details[0]?.applied_amount})`
            : '-',
        donation: payment.donation_id ? 'Si' : 'No',
      };

      worksheet.addRow(baseRow);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
