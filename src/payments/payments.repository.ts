import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { GetStudentPaymentsDto } from './dto/get-student-payments.dto';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';
import { Prisma } from '@prisma/client';

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

  async getAllPayments(queryParams: GetStudentPaymentsDto, programs: string[]) {
    const where: Prisma.paymentsWhereInput = {};

    if (queryParams.searchQuery) {
      where.students = {
        OR: [
          {
            first_name: {
              contains: queryParams.searchQuery,
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: queryParams.searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    if (programs.length > 0) {
      where.AND = {
        students: {
          student_grades: {
            every: {
              program_levels: {
                program_id: {
                  in: programs,
                },
              },
            },
          },
        },
      };
    }

    const { data, total } = await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.payments
    >(
      this.prismaService.payments,
      {
        where,
        include: {
          students: {
            select: {
              student_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
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
      },
      {
        page: queryParams.page,
        take: queryParams.take,
      },
    );

    return { data, total };
  }

  async getPaymentById(
    paymentId: string,
    { includePaymentDetails = true, includeStudentData = false } = {},
  ) {
    const paymentDetails = await this.prismaService.payments.findUnique({
      where: {
        payment_id: paymentId,
      },
      include: {
        payment_details: includePaymentDetails && {
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
        students: includeStudentData && {
          select: {
            student_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return paymentDetails;
  }

  async removePaymentById(paymentId: string) {
    const payment = await this.getPaymentById(paymentId);

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    try {
      const paymentDeleted = await this.prismaService.$transaction([
        this.prismaService.payments.delete({
          where: {
            payment_id: paymentId,
          },
          include: {
            payment_details: {
              select: {
                charges: {
                  select: {
                    charge_types: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                applied_amount: true,
              },
            },
          },
        }),
        this.prismaService.student_balance.update({
          where: {
            student_id: payment.student_id,
          },
          data: {
            balance: {
              increment: payment.amount,
            },
          },
        }),
      ]);

      return paymentDeleted;
    } catch (error) {
      throw new BadRequestException('Error deleting payment');
    }
  }
}
