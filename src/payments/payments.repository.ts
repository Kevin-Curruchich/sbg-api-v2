import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { GetStudentPaymentsRepository } from './dto/get-student-payments.dto';
import { Prisma } from '@prisma/client';
import { PaymentReportsDto } from 'src/reports/dto/payments-reports.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudentPayment(data: CreateStudentPaymentDto) {
    const { is_from_credit_balance } = data;

    try {
      //create a new prisma transaction, create a new payment, and create the payment details for finish to update the student balance
      const payment = await this.prismaService.$transaction(async (prisma) => {
        const createdPayment = prisma.payments.create({
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
        });

        if (!is_from_credit_balance) {
          await prisma.student_balance.update({
            where: {
              student_id: data.student_id,
            },
            data: {
              balance: {
                decrement: data.amount,
              },
            },
          });
        }

        return createdPayment;
      });

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

  async getAllPaymentsWithoutPagination(
    queryParams: PaymentReportsDto,
    programs: string[],
  ) {
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

    if (queryParams.payment_date_start && queryParams.payment_date_end) {
      where.payment_date = {
        gte: dayjs(queryParams.payment_date_start).startOf('day').toDate(),
        lte: dayjs(queryParams.payment_date_end).endOf('day').toDate(),
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

    const payments = await this.prismaService.payments.findMany({
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
        payment_methods: {
          select: {
            payment_method_id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return payments;
  }

  async getAllPayments(
    queryParams: GetStudentPaymentsRepository,
    programs: string[],
    settings: {
      returnPaginated: boolean;
    } = { returnPaginated: true },
  ) {
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

    if (queryParams.payment_date_start && queryParams.payment_date_end) {
      where.payment_date = {
        gte: dayjs(queryParams.payment_date_start).startOf('day').toDate(),
        lte: dayjs(queryParams.payment_date_end).endOf('day').toDate(),
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

    const payments = await this.prismaService.payments.findMany({
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
        payment_methods: {
          select: {
            payment_method_id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      ...(settings.returnPaginated && {
        skip: (queryParams.page - 1) * queryParams.take,
        take: queryParams.take,
      }),
    });

    const total = await this.prismaService.payments.count({ where });

    return { data: payments, total };
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

  async totalPaymentsByMonth(
    paymentsDates: {
      startDate: string;
      endDate: string;
    },
    programs: string[],
  ) {
    const where: Prisma.paymentsWhereInput = {
      payment_date: {
        gte: paymentsDates.startDate,
        lte: paymentsDates.endDate,
      },
    };

    if (programs.length > 0) {
      where.students = {
        student_grades: {
          some: {
            program_levels: {
              program_id: {
                in: programs,
              },
            },
          },
        },
      };
    }

    const payments = await this.prismaService.payments.findMany({
      where,
      select: {
        amount: true,
      },
    });

    const total = payments.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0,
    );

    return total;
  }
}
