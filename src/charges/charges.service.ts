import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import 'dayjs/locale/es'; // Import Spanish locale

dayjs.locale('es');

import { StudentService } from 'src/students/students.service';
import { formatCurrency } from 'src/common/helpers/currency.helper';
import User from 'src/auth/interfaces/user.interface';

import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateStudentChargeDto } from './dto/update-student-charge.dto';

import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';

import { ChargesRepository } from './charges.repository';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import { StudentChargesQueryDto } from './dto/student-charges-query.dto';
import { GetChargesCreated } from './dto/get-charges-created.dto';

@Injectable()
export class ChargesService {
  constructor(
    private readonly chargesRepository: ChargesRepository,
    private readonly studentsService: StudentService,
  ) {}

  create(createChargeDto: CreateChargeDto) {
    return 'This action adds a new charge';
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

  getChargeTypesByProgramId(programId: string) {
    return this.chargesRepository.getChargesByProgramId(programId);
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
    const student = await this.studentsService.getStudentGeneralInfo(studentId);
    const studentGrade =
      await this.studentsService.getLastStudentGrade(studentId);

    const { student_types } = student;

    const lastProgramStudent = studentGrade;

    return await this.chargesRepository.getChargesApplyToStudent({
      student_type_id: student_types.student_type_id,
      program_level_id: lastProgramStudent.program_levels.program_level_id,
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

  remove(id: number) {
    return `This action removes a #${id} charge`;
  }
}
