import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudentPayment(data: CreateStudentPaymentDto) {
    try {
      //create a new prisma transaction, create a new payment, and create the payment details for finish to update the student balance
      const payment = await this.prismaService.$transaction([
        this.prismaService.payments.create({
          data: {
            student_id: data.student_id,
            payment_method_id: data.payment_method_id,
            reference_number: data.reference_number,
            amount: data.amount,
            payment_date: data.payment_date,
            payment_details: {
              create: data.payment_details,
            },
          },
          include: {
            payment_details: {
              select: {
                applied_amount: true,
                description: true,
                charges: {
                  select: {
                    charge_id: true,
                    current_amount: true,
                    charge_types: {
                      select: {
                        name: true,
                        charge_type_id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prismaService.student_balance.update({
          where: {
            student_id: data.student_id,
          },
          data: {
            balance: {
              decrement: data.amount,
            },
          },
        }),
      ]);

      return payment;
    } catch (error) {
      console.log(error);
    }
  }

  async getPaymentsByChargeId(studentChargeId: string) {
    return await this.prismaService.payment_details.findMany({
      where: {
        charge_id: studentChargeId,
      },
    });
  }
}
