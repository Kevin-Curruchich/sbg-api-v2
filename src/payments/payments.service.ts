import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as dayjs from 'dayjs';

import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import { ChargesService } from '../charges/charges.service';

import { StudentService } from 'src/students/students.service';
import SendGridService from '../common/sendgrid.service';

import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly sendGridService: SendGridService,
    private readonly studentsService: StudentService,
    private readonly configService: ConfigService,
    private readonly chargesService: ChargesService,
  ) {}

  async createStudentPayment(createPaymentDto: CreateStudentPaymentDto) {
    const paymentCreated = await this.paymentsRepository.createStudentPayment({
      ...createPaymentDto,
      payment_date: dayjs(createPaymentDto.payment_date).toDate(),
    });

    //Get student charges applied to the payment and validate if each charge is paid in full or not to update the charge status
    const studentCharges = paymentCreated[0].payment_details.map((detail) => ({
      charge_id: detail.charges.charge_id,
      current_amount: detail.charges.current_amount,
      payment_applied_amount: detail.applied_amount,
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
          charge_status_id: ChargeStatuses.PARTIAL_PAID,
        });
      }
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
        paymentDescription: detail.description,
        paymentAmount: detail.applied_amount,
      })),
    };

    await this.sendGridService.sendEmail(
      student.email,
      this.configService.get<string>('PAYMENT_TEMPLATE_ID'),
      paymentData,
    );

    return paymentCreated;
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
