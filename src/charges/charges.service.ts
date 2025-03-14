import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

import { StudentService } from 'src/students/students.service';

import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';

import { ChargesRepository } from './charges.repository';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import StudentChargesQueryDto from './dto/student-charges-query.dto';

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

  findAll() {
    return `This action returns all charges`;
  }

  getChargeTypesByProgramId(programId: string) {
    return this.chargesRepository.getChargesByProgramId(programId);
  }

  updateChargeStatus(chargeId: string, data: { charge_status_id: string }) {
    return this.chargesRepository.updateChargeStatus(chargeId, data);
  }

  async getChargesByStudentId(
    studentId: string,
    chargesQuery: StudentChargesQueryDto,
  ) {
    const studentChargesAndPayment =
      await this.chargesRepository.getChargesByStudentId(
        studentId,
        chargesQuery,
      );

    //map the student charge and payment and return by charge the total amount paid and the total amount due for each charge
    return studentChargesAndPayment.map((charge) => {
      const totalAmountPaid = charge.payment_details.reduce(
        (acc, payment) => acc + Number(payment.applied_amount),
        0,
      );

      const totalAmountDue = Number(charge.current_amount) - totalAmountPaid;

      return {
        ...charge,
        due_date: dayjs(charge.due_date).format('YYYY-MM-DD'),
        due_date_formatted: dayjs(charge.due_date).format('DD/MM/YYYY'),
        totalAmountPaid,
        totalAmountDue,
        payment_details: charge.payment_details.map((payment) => ({
          ...payment,
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
    const student = await this.studentsService.getStudentById(studentId);

    const { student_grades, student_types } = student;

    const lastProgramStudent = student_grades[0];

    return await this.chargesRepository.getChargesApplyToStudent({
      student_type_id: student_types.student_type_id,
      program_level_id: lastProgramStudent.program_levels.program_level_id,
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} charge`;
  }

  update(id: number, updateChargeDto: UpdateChargeDto) {
    return `This action updates a #${id} charge`;
  }

  remove(id: number) {
    return `This action removes a #${id} charge`;
  }
}
