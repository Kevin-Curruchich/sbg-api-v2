import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import * as dayjs from 'dayjs';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateStudentPaymentDto,
  CreateStudentsPaymentDto,
  CreateStudentPaymentDevolutionDto,
} from './dto/create-student-payment.dto';
import { GetStudentPaymentsRepository } from './dto/get-student-payments.dto';
import { PaymentReportsDto } from 'src/reports/dto/payments-reports.dto';
import { GetStudentsPaymentsReportsDto } from './dto/get-student-payments-reports.dto';
import { StudentBalanceTransaction } from 'src/common/enums/student-balance-transaction.enum';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudentPayment(data: CreateStudentPaymentDto) {
    try {
      // Obtener balance actual antes de la transacción
      const currentBalance = await this.getStudentTransactionsBalance(
        data.student_id,
      );

      const payment = await this.prismaService.$transaction(async (prisma) => {
        // 1. Crear el pago con sus detalles
        const createdPayment = await prisma.payments.create({
          data: {
            student_id: data.student_id,
            payment_method_id: data.payment_method_id,
            reference_number: data.reference_number,
            amount: data.amount,
            payment_date: data.payment_date,
            payment_details: {
              create: data.payment_details.map((detail) => ({
                charge_id: detail.charge_id,
                applied_amount: detail.applied_amount,
                description: detail.description,
              })),
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

        // 2. Lógica de balance - verificar si hay pagos desde crédito
        const includeAmountFromBalance = data.payment_details.some(
          (detail) => detail.is_from_credit_balance,
        );

        if (!includeAmountFromBalance) {
          // Calcular monto que no viene del balance de crédito
          const totalAmountNotFromCreditBalance = data.payment_details
            .filter((detail) => !detail.is_from_credit_balance)
            .reduce((acc, detail) => acc + detail.applied_amount, 0);

          let amountToApplyOnBalance = totalAmountNotFromCreditBalance;

          const differenceAmounts =
            data.amount - totalAmountNotFromCreditBalance;

          if (differenceAmounts !== 0) {
            // Si el monto total del pago es mayor que el total de los detalles,
            // aplicamos la diferencia al balance del estudiante
            amountToApplyOnBalance += differenceAmounts;
          }

          // 3. ✅ CREAR TRANSACCIÓN DE BALANCE (CREDIT)
          await prisma.student_balance_transactions.create({
            data: {
              student_id: data.student_id,
              amount: -amountToApplyOnBalance, // ✅ NEGATIVO porque es un CREDIT (reduce deuda)
              reference_id: createdPayment.payment_id,
              transaction_type: StudentBalanceTransaction.CREDIT, // ✅ CREDIT porque es un pago
              description: `Payment received: ${data.reference_number || 'No reference'}`,
              previous_balance: currentBalance.studentTransactionBalance,
              new_balance:
                currentBalance.studentTransactionBalance -
                amountToApplyOnBalance,
            },
          });
        } else {
          // 5. ✅ MANEJAR PAGOS DESDE BALANCE DE CRÉDITO
          // Si algunos pagos vienen del balance de crédito, solo actualizamos los cargos
          // pero no creamos nueva transacción de balance
          await Promise.all(
            data.payment_details
              .filter((detail) => !detail.is_from_credit_balance)
              .map((detail) =>
                prisma.charges.update({
                  where: { charge_id: detail.charge_id },
                  data: {
                    current_amount: {
                      decrement: detail.applied_amount,
                    },
                  },
                }),
              ),
          );

          // Si hay diferencia en el monto y no todo viene del crédito
          const totalAmountNotFromCreditBalance = data.payment_details
            .filter((detail) => !detail.is_from_credit_balance)
            .reduce((acc, detail) => acc + detail.applied_amount, 0);

          const differenceAmounts =
            data.amount - totalAmountNotFromCreditBalance;

          if (totalAmountNotFromCreditBalance && differenceAmounts > 0) {
            // Crear transacción solo por la diferencia
            await prisma.student_balance_transactions.create({
              data: {
                student_id: data.student_id,
                amount: -differenceAmounts,
                reference_id: createdPayment.payment_id,
                transaction_type: StudentBalanceTransaction.CREDIT,
                description: `Payment difference applied: ${data.reference_number || 'No reference'}`,
                previous_balance: currentBalance.studentTransactionBalance,
                new_balance:
                  currentBalance.studentTransactionBalance - differenceAmounts,
              },
            });
          }
        }

        return createdPayment;
      });

      return payment;
    } catch (error) {
      console.log('Error creating student payment:', error);
      throw error;
    }
  }

  async createPaymentsForStudents(
    createStudentPaymentsDto: CreateStudentsPaymentDto,
  ) {
    // Validar que todos los estudiantes existen
    const students = await this.prismaService.students.findMany({
      where: {
        student_id: {
          in: createStudentPaymentsDto.student_ids,
        },
      },
    });

    if (students.length !== createStudentPaymentsDto.student_ids.length) {
      throw new BadRequestException('Some students not found');
    }

    const totalAmount = createStudentPaymentsDto.amount;
    const amountPerStudent =
      totalAmount / createStudentPaymentsDto.student_ids.length;

    // Obtener balances actuales de todos los estudiantes
    const studentBalances = await Promise.all(
      createStudentPaymentsDto.student_ids.map((studentId) =>
        this.getStudentTransactionsBalance(studentId),
      ),
    );

    const balanceMap = new Map();
    createStudentPaymentsDto.student_ids.forEach((studentId, index) => {
      balanceMap.set(
        studentId,
        studentBalances[index].studentTransactionBalance,
      );
    });

    // ✅ USAR TRANSACCIONES PARA ATOMICIDAD
    await this.prismaService.$transaction(async (prisma) => {
      // 1. Crear una donacion
      const donation = await prisma.donations.create({
        data: {
          amount: createStudentPaymentsDto.amount,
          description: createStudentPaymentsDto.payment_description,
          payment_method_id: createStudentPaymentsDto.payment_method_id,
          reference_number: createStudentPaymentsDto.reference_number,
        },
      });

      // 2. Crear pagos para cada estudiante
      await Promise.all(
        createStudentPaymentsDto.student_ids.map((studentId) =>
          prisma.payments.create({
            data: {
              student_id: studentId,
              amount: amountPerStudent,
              payment_date: createStudentPaymentsDto.payment_date,
              payment_method_id: createStudentPaymentsDto.payment_method_id,
              reference_number: `${createStudentPaymentsDto.reference_number} - donation=${donation.donation_id}`,
              donation_id: donation.donation_id,
            },
          }),
        ),
      );

      // 3. ✅ CREAR TRANSACCIONES DE BALANCE PARA CADA ESTUDIANTE
      await Promise.all(
        createStudentPaymentsDto.student_ids.map((studentId) => {
          const currentBalance = balanceMap.get(studentId) || 0;
          return prisma.student_balance_transactions.create({
            data: {
              student_id: studentId,
              amount: -amountPerStudent, // ✅ NEGATIVO porque es CREDIT
              reference_id: createStudentPaymentsDto.payment_method_id,
              transaction_type: StudentBalanceTransaction.CREDIT,
              description: `DONATION-${Date.now()}-${studentId.slice(-4)}`,
              previous_balance: currentBalance,
              new_balance: currentBalance - amountPerStudent,
            },
          });
        }),
      );
    });

    return {
      message: 'Payments created successfully',
      amountPerStudent,
      studentsAffected: createStudentPaymentsDto.student_ids.length,
    };
  }

  async createPaymentDevolution(
    studentPaymentDevolution: CreateStudentPaymentDevolutionDto,
  ) {
    const studentBalance = await this.getStudentTransactionsBalance(
      studentPaymentDevolution.student_id,
    );

    return await this.prismaService.student_balance_transactions.create({
      data: {
        student_id: studentPaymentDevolution.student_id,
        transaction_type: StudentBalanceTransaction.DEBIT,
        amount: -studentPaymentDevolution.amount,
        previous_balance: studentBalance
          ? studentBalance.studentTransactionBalance
          : 0,
        new_balance:
          (studentBalance ? studentBalance.studentTransactionBalance : 0) -
          studentPaymentDevolution.amount,
        description: `PAYMENT_DEVOLUTION-${dayjs().format('YYYY-MM-DD HH:mm:ss')}-${studentPaymentDevolution.reason}`,
      },
    });
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
                charge_statuses: {
                  select: {
                    name: true,
                    charge_status_id: true,
                  },
                },
                due_date: true,
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

    // Obtener balance actual antes del reverso
    const currentBalance = await this.getStudentTransactionsBalance(
      payment.student_id,
    );

    try {
      const paymentDeleted = await this.prismaService.$transaction(
        async (prisma) => {
          // 1. Eliminar el pago
          const deletedPayment = await prisma.payments.delete({
            where: {
              payment_id: paymentId,
            },
            include: {
              payment_details: {
                select: {
                  charges: {
                    select: {
                      charge_id: true,
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
          });

          // 2. ✅ CREAR TRANSACCIÓN DE REVERSO
          await prisma.student_balance_transactions.create({
            data: {
              student_id: payment.student_id,
              amount: Number(payment.amount), // ✅ POSITIVO porque revierte el pago (aumenta deuda)
              reference_id: paymentId,
              transaction_type: StudentBalanceTransaction.DEBIT, // ✅ DEBIT porque revierte un pago
              description: `Payment reversal: ${payment.reference_number || paymentId}`,
              previous_balance: currentBalance.studentTransactionBalance,
              new_balance:
                currentBalance.studentTransactionBalance +
                Number(payment.amount),
            },
          });

          return deletedPayment;
        },
      );

      return paymentDeleted;
    } catch (error) {
      console.log('Error deleting payment:', error);
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
        student_programs: {
          some: {
            program_id: {
              in: programs,
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

  async getStudentTransactionsBalance(studentId: string) {
    const result =
      await this.prismaService.student_balance_transactions.aggregate({
        where: { student_id: studentId },
        _sum: { amount: true },
      });

    const balance = Number(result._sum.amount ?? 0);

    return {
      studentTransactionBalance: balance,
    };
  }

  async getPaymentsReport(filters: GetStudentsPaymentsReportsDto) {
    const where: Prisma.paymentsWhereInput = {
      ...(filters.start_date &&
        filters.end_date && {
          payment_date: {
            gte: new Date(filters.start_date),
            lte: new Date(filters.end_date),
          },
        }),
      students: {
        AND: [
          ...(filters?.searchQuery
            ? [
                {
                  first_name: {
                    contains: filters.searchQuery,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              ]
            : []),
          ...(filters?.searchQuery
            ? [
                {
                  last_name: {
                    contains: filters.searchQuery,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              ]
            : []),
          ...(filters?.program_id
            ? [
                {
                  student_grades: {
                    some: {
                      program_levels: {
                        program_id: filters.program_id,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    };

    return this.prismaService.payments.findMany({
      where,
      include: {
        students: {
          select: {
            first_name: true,
            last_name: true,
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
                  },
                },
              },
            },
          },
        },
        payment_methods: {
          select: {
            name: true,
            payment_method_id: true,
          },
        },
      },
    });
  }
}
