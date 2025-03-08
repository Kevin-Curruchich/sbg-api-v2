import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudentPayment(data: any) {
    try {
      //create a new prisma transaction, create a new payment, and create the payment details for finish to update the student balance
      const payment = await this.prismaService.$transaction([
        this.prismaService.payments.create({
          data: {
            student_id: data.student_id,
            payment_method: data.payment_method,
            reference_number: data.reference_number,
            amount: data.amount,
            payment_date: data.payment_date,
            payment_details: {
              create: data.payment_details,
            },
          },
          include: {
            payment_details: {
              include: {
                charges: {
                  select: {
                    charge_types: {
                      select: {
                        name: true,
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
      //   this.handleError(error);
    }
  }
}
