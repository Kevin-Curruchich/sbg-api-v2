import { Injectable } from '@nestjs/common';

import * as dayjs from 'dayjs';

import { StudentService } from 'src/students/students.service';
import SendGridService from '../common/sendgrid.service';

import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { PaymentsRepository } from './payments.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly sendGridService: SendGridService,
    private readonly studentsService: StudentService,
    private readonly configService: ConfigService,
  ) {}

  async createStudentPayment(createPaymentDto: CreateStudentPaymentDto) {
    const paymentCreated = await this.paymentsRepository.createStudentPayment({
      ...createPaymentDto,
      payment_date: dayjs(createPaymentDto.payment_date).toDate(),
    });

    //send email to student
    const student = await this.studentsService.getStudentById(
      createPaymentDto.student_id,
    );

    const paymentData = {
      paymentDate: dayjs(paymentCreated[0].payment_date).format('DD/MM/YYYY'),
      paymentId: paymentCreated[0].payment_id,
      studentFullName: `${student.first_name} ${student.last_name}`,
      paymentAmount: paymentCreated[0].amount,
      paymentDetails: paymentCreated[0].payment_details.map((detail) => ({
        collectionName: detail.charges.charge_types.name,
        paymentDescription: detail.charges.charge_types.name,
        paymentAmount: detail.applied_amount,
      })),
    };

    await this.sendGridService.sendEmail(
      student.email,
      this.configService.get<string>('PAYMENT_TEMPLATE_ID'),
      paymentData,
    );
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
