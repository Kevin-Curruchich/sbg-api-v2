import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import 'dayjs/locale/es'; // Import Spanish locale

dayjs.locale('es');

import { StudentService } from 'src/students/students.service';
import { formatCurrency } from 'src/common/helpers/currency.helper';
import User from 'src/auth/interfaces/user.interface';

import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateStudentChargeDto } from './dto/update-student-charge.dto';

import {
  CreateForStudentChargeDto,
  CreateForStudentsChargeDto,
} from './dto/create-charge-for-student.dto';

import { ChargesRepository } from './charges.repository';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import { StudentChargesQueryDto } from './dto/student-charges-query.dto';
import {
  GetChargesAppliedToStudentsByFiltersDto,
  GetChargesCreated,
} from './dto/get-charges-created.dto';
import { GetChargesTypes } from './dto/get-charges-types';
import { FrequencyLabels } from './constants/frequency.constant';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { formatDate } from 'src/common/helpers/date.helper';

@Injectable()
export class ChargesService {
  constructor(
    private readonly chargesRepository: ChargesRepository,
    private readonly studentsService: StudentService,
  ) {}

  createChargeType(createChargeDto: CreateChargeDto) {
    return this.chargesRepository.createChargeType(createChargeDto);
  }

  async getChargeTypes(query: GetChargesTypes) {
    const { data, total } = await this.chargesRepository.getChargeTypes(query);

    const responseEnhanced = data.map((type) => ({
      ...type,
      frequency: {
        frequency_id: type.frequency,
        name: FrequencyLabels[type.frequency],
      },
    }));

    return {
      data: responseEnhanced,
      total,
    };
  }

  async getChargeFrequency() {
    const frequencies = await this.chargesRepository.getChargeFrequency();

    return frequencies.map((frequency) => ({
      frequency_id: frequency,
      name: FrequencyLabels[frequency],
    }));
  }

  createChargeForStudent(createChargeDto: CreateForStudentChargeDto) {
    const data = {
      ...createChargeDto,
      current_amount: createChargeDto.original_amount,
      due_date: dayjs(createChargeDto.due_date).toDate(),
      charge_status_id: ChargeStatuses.PENDING,
    };

    return this.chargesRepository.createChargeForStudent(data);
  }

  createChargesForStudents(createChargeDto: CreateForStudentsChargeDto) {
    const data = {
      ...createChargeDto,
      current_amount: createChargeDto.original_amount,
      due_date: dayjs(createChargeDto.due_date).toDate(),
    };

    return this.chargesRepository.createChargesForStudents(data);
  }

  async getAllCharges(query: GetChargesCreated, user: User) {
    const programs = user.admin_programs.map((program) => program.program_id);

    const queryWithDates = {
      ...query,
      //using dayjs get the start and end date of the due date month
      due_date_start: dayjs(query.due_date).startOf('month').toDate(),
      due_date_end: dayjs(query.due_date).endOf('month').toDate(),
    };

    const result = await this.chargesRepository.getAllCharges(
      queryWithDates,
      programs,
    );

    const data = result.data.map((charge) => {
      const totalAmountPaid = charge['payment_details'].reduce(
        (acc, payment) => acc + Number(payment['applied_amount']),
        0,
      );

      const totalAmountDue = Number(charge['current_amount']) - totalAmountPaid;

      const totalAmountPaidFormatted = formatCurrency(totalAmountPaid);
      const totalAmountDueFormatted = formatCurrency(totalAmountDue);

      return {
        ...charge,
        totalAmountPaidFormatted,
        totalAmountDueFormatted,
        totalAmountPaid: totalAmountPaid,
        totalAmountDue: totalAmountDue,
        currentAmountFormatted: formatCurrency(
          Number(charge['current_amount']),
        ),
        due_date: dayjs(charge.due_date).format('YYYY-MM-DD'),
        due_date_formatted: dayjs(charge.due_date).format('DD/MM/YYYY'),
      };
    });

    return {
      data,
      total: result.total,
    };
  }

  getChargesApplyToStudentsByFilters(
    queryParams: GetChargesAppliedToStudentsByFiltersDto,
  ) {
    return this.chargesRepository.getChargesApplyToStudentsByFilters(
      queryParams,
    );
  }

  getChargeStatuses() {
    return this.chargesRepository.getChargeStatuses();
  }

  updateChargeStatus(chargeId: string, data: { charge_status_id: string }) {
    return this.chargesRepository.updateChargeStatus(chargeId, data);
  }

  async getChargesByStudentId(
    studentId: string,
    chargesQuery: StudentChargesQueryDto,
  ) {
    const queryWithDate = {
      ...chargesQuery,
      due_date_start: dayjs(chargesQuery.due_date).startOf('month').toDate(),
      due_date_end: dayjs(chargesQuery.due_date).endOf('month').toDate(),
    };

    const studentChargesAndPayment =
      await this.chargesRepository.getChargesByStudentId(
        studentId,
        queryWithDate,
      );

    //map the student charge and payment and return by charge the total amount paid and the total amount due for each charge
    return studentChargesAndPayment.map((charge) => {
      const totalAmountPaid = charge.payment_details.reduce(
        (acc, payment) => acc + Number(payment.applied_amount),
        0,
      );

      const totalAmountDue = Number(charge.current_amount) - totalAmountPaid;
      const totalAmountDueFormatted = formatCurrency(totalAmountDue);
      const totalAmountPaidFormatted = formatCurrency(totalAmountPaid);

      return {
        ...charge,
        charge_types: {
          ...charge.charge_types,
          name: `${charge.charge_types.name} | ${dayjs(charge.due_date).format('MMMM YY')}`,
        },
        due_date: dayjs(charge.due_date).format('YYYY-MM-DD'),
        due_date_formatted: dayjs(charge.due_date).format('DD/MM/YYYY'),
        totalAmountPaid,
        totalAmountDue,
        totalAmountPaidFormatted,
        totalAmountDueFormatted,
        current_amount_formatted: formatCurrency(Number(charge.current_amount)),
        payment_details: charge.payment_details.map((payment) => ({
          ...payment,
          applied_amount_formatted: formatCurrency(
            Number(payment.applied_amount),
          ),
          payment_date: dayjs(payment.payments.payment_date).format(
            'YYYY-MM-DD',
          ),
          payment_date_formatted: dayjs(payment.payments.payment_date).format(
            'DD/MM/YYYY',
          ),
        })),
      };
    });
  }

  async getChargesApplyToStudent(studentId: string) {
    const studentGrade = await this.studentsService.getStudentGrades(studentId);

    const program_ids = studentGrade.map((grade) => grade.programs.program_id);

    return await this.chargesRepository.getChargesApplyToStudent({
      program_ids,
    });
  }

  async updateChargeStudent(
    chargeId: string,
    updateChargeDto: UpdateStudentChargeDto,
  ) {
    const { original_amount: new_amount } = updateChargeDto;

    const originalCharge =
      await this.chargesRepository.getStudentChargeById(chargeId);

    const originalChargePayed = originalCharge.payment_details.reduce(
      (acc, payment) => acc + Number(payment.applied_amount),
      0,
    );

    const differenceAmount =
      Number(new_amount) - Number(originalCharge.current_amount);

    let amountOfCreditNote = 0;

    if (originalChargePayed > new_amount) {
      amountOfCreditNote = originalChargePayed - new_amount;
    }

    //Balance adjustment is the difference between the new amount and the original amount
    //if balance adjustment is negative, it means that the student has a credit note
    //if balance adjustment is positive, it means that the student has to pay more

    const data = {
      student_id: originalCharge.student_id,
      current_amount: new_amount,
      due_date: dayjs(updateChargeDto.due_date).toDate(),
      description: updateChargeDto.description,
      balanceAdjustment: differenceAmount,
      amountOfCreditNote,
    };

    return this.chargesRepository.updateStudentCharge(chargeId, data);
  }

  async getStudentBalance(studentId: string) {
    const { studentBalance } =
      await this.chargesRepository.totalAmountOwedAndBalance(studentId);

    const studentChargesAndPayment =
      await this.chargesRepository.getChargesByStudentId(studentId, {});

    const totalAmountPaid = studentChargesAndPayment.reduce(
      (acc, charge) =>
        acc +
        charge.payment_details.reduce(
          (acc, payment) => acc + Number(payment.applied_amount),
          0,
        ),
      0,
    );
    const totalAmountDue = studentChargesAndPayment.reduce(
      (acc, charge) => acc + Number(charge.current_amount),
      0,
    );

    const totalAmountOwed = totalAmountDue - totalAmountPaid;

    const studentCredit =
      studentBalance < 0
        ? Math.abs(studentBalance)
        : +Math.abs(studentBalance - totalAmountOwed).toFixed(2);

    return {
      totalAmountOwed,
      studentHasCredit: studentCredit > 0,
      studentCredit,
      studentCreditFormatted: formatCurrency(Math.abs(studentCredit)),
      studentAmountOwedFormatted: formatCurrency(Math.abs(totalAmountOwed)),
    };
  }

  // Add this method to ChargesService class
  async getPaymentCollectionRate(
    programs: string[],
    period?: { start: Date; end: Date },
  ) {
    const result = await this.chargesRepository.getPaymentCollectionRate(
      programs,
      period,
    );

    return {
      totalCharges: formatCurrency(result.totalCharges),
      totalPaid: formatCurrency(result.totalPaid),
      collectionRate: result.collectionRate.toFixed(2) + '%',
    };
  }

  async generateStudentChargesReport(filters: {
    programId?: string;
    studentTypeId?: string;
  }): Promise<Buffer> {
    const charges =
      await this.chargesRepository.getDetailedChargesReport(filters);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Charges');

    worksheet.columns = [
      { header: 'StudentID', key: 'student_id', width: 0 },
      { header: 'Nombre del Estudiante', key: 'student_name', width: 30 },
      { header: 'Programa', key: 'program', width: 30 },
      { header: 'Tipo de Cobro', key: 'charge_type', width: 20 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Monto Pagado', key: 'payed_amount', width: 15 },
      { header: 'Saldo', key: 'amount_due', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha de Vencimiento', key: 'due_date', width: 20 },
    ];

    charges.forEach((charge) => {
      const payedAmount = charge.payment_details.reduce(
        (sum, detail) => sum + Number(detail.applied_amount),
        0,
      );

      const amountDue = Number(charge.current_amount) - payedAmount;

      worksheet.addRow({
        student_id: charge.students.student_id,
        student_name: `${charge.students.first_name} ${charge.students.last_name}`,
        program:
          charge.students.student_grades[0]?.program_levels.programs.name ||
          'N/A',
        charge_type: charge.charge_types.name,
        amount: Number(charge.current_amount),
        payed_amount: payedAmount,
        amount_due: Number(amountDue),
        status: charge.charge_statuses.name,
        due_date: formatDate(charge.due_date, 'DD/MM/YYYY') || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  }

  async generateStudentSpecificChargesReport(
    studentId: string,
  ): Promise<Buffer> {
    const charges =
      await this.chargesRepository.getStudentChargesWithDetails(studentId);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Charges');

    worksheet.columns = [
      { header: 'charge_id', key: 'charge_id', width: 0 },
      { header: 'Cobro', key: 'charge_type', width: 20 },
      { header: 'Descripción', key: 'description', width: 30 },
      { header: 'Monto Original', key: 'original_amount', width: 15 },
      { header: 'Monto Actual', key: 'current_amount', width: 15 },
      { header: 'Total Pagado', key: 'total_paid', width: 15 },
      { header: 'Monto Pendiente', key: 'outstanding_amount', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha de Vencimiento', key: 'due_date', width: 20 },
    ];

    charges.forEach((charge) => {
      const totalPaid = charge.payment_details.reduce(
        (sum, detail) => sum + Number(detail.applied_amount),
        0,
      );

      const outstandingAmount = Number(charge.current_amount) - totalPaid;

      worksheet.addRow({
        charge_id: charge.charge_id,
        charge_type: charge.charge_types.name,
        description: charge.description || 'N/A',
        original_amount: Number(charge.original_amount),
        current_amount: Number(charge.current_amount),
        outstanding_amount: outstandingAmount,
        total_paid: totalPaid,
        status: charge.charge_statuses.name,
        due_date: formatDate(charge.due_date, 'DD/MM/YYYY'),
      });
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  remove(id: number) {
    return `This action removes a #${id} charge`;
  }
}
