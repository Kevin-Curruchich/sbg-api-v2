import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentChargeRepositoryDto } from './dto/student-charges-query.dto';
import { GetChargesCreatedRepository } from './dto/get-charges-created.dto';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';

@Injectable()
export class ChargesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllCharges(query: GetChargesCreatedRepository) {
    const { search_query, charge_status_id, charge_type_id, due_date } = query;

    const { data, total } = await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.charges
    >(
      this.prismaService.charges,
      {
        where: {
          //validate if filters are present to filter the data
          charge_types: {
            charge_type_id: charge_type_id,
          },
          charge_status_id: charge_status_id,

          due_date: due_date
            ? {
                gte: query.due_date_start,
                lte: query.due_date_end,
              }
            : undefined,
          OR: [
            {
              students: {
                first_name: {
                  contains: search_query,
                  mode: 'insensitive',
                },
              },
            },
            {
              students: {
                last_name: {
                  contains: search_query,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        include: {
          charge_types: {
            select: {
              name: true,
              description: true,
              default_amount: true,
            },
          },
          charge_statuses: {
            select: {
              name: true,
              description: true,
              charge_status_id: true,
            },
          },
          students: {
            select: {
              first_name: true,
              last_name: true,
              student_id: true,
              student_grades: {
                select: {
                  program_levels: {
                    select: {
                      program_id: true,
                    },
                  },
                },
              },
            },
          },
          payment_details: {
            select: {
              payment_detail_id: true,
              applied_amount: true,
              payments: {
                select: {
                  payment_evidence: true,
                  payment_date: true,
                  payment_id: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },

      {
        page: query.page,
        take: query.take,
      },
    );

    return { data, total };
  }

  async getChargesByProgramId(programId: string) {
    return await this.prismaService.charge_types.findMany({
      where: {
        program_id: programId,
      },
    });
  }

  async createChargeForStudent(data: any) {
    try {
      //create a prisma transaction, to create a charge for a student and update the student balance
      const charge = await this.prismaService.$transaction([
        this.prismaService.charges.create({
          data: {
            student_id: data.student_id,
            charge_type_id: data.charge_type_id,
            original_amount: data.original_amount,
            current_amount: data.original_amount,
            due_date: data.due_date,
            charge_status_id: data.charge_status_id,
            description: data.description,
          },
        }),

        this.prismaService.student_balance.upsert({
          where: {
            student_id: data.student_id,
          },
          create: {
            student_id: data.student_id,
            balance: data.original_amount,
          },
          update: {
            balance: {
              increment: data.original_amount,
            },
          },
        }),
      ]);
      return charge;
    } catch (error) {
      console.log(error);
      this.handleError(error);
    }
  }

  async getChargesByStudentId(
    studentId: string,
    chargesQuery: StudentChargeRepositoryDto,
  ) {
    const { due_date } = chargesQuery;

    const studentCharges = await this.prismaService.charges.findMany({
      where: {
        student_id: studentId,
        charge_status_id: chargesQuery.charge_status_id,
        due_date: due_date
          ? {
              gte: chargesQuery.due_date_start,
              lte: chargesQuery.due_date_end,
            }
          : undefined,
      },
      select: {
        charge_id: true,
        current_amount: true,
        original_amount: true,
        due_date: true,
        created_at: true,
        updated_at: true,
        charge_types: {
          select: {
            charge_type_id: true,
            name: true,
            description: true,
            default_amount: true,
          },
        },
        charge_statuses: {
          select: {
            name: true,
            description: true,
            charge_status_id: true,
          },
        },
        payment_details: {
          select: {
            payment_detail_id: true,
            applied_amount: true,
            payments: {
              select: {
                payment_evidence: true,
                payment_date: true,
                payment_id: true,
              },
            },
          },
        },
      },
    });

    return studentCharges;
  }

  async updateChargeStatus(
    chargeId: string,
    data: { charge_status_id: string },
  ) {
    return await this.prismaService.charges.update({
      where: {
        charge_id: chargeId,
      },
      data: {
        charge_status_id: data.charge_status_id,
      },
    });
  }

  async getChargesApplyToStudent(query: {
    student_type_id?: string;
    program_id?: string;
    program_level_id?: string;
  }) {
    return await this.prismaService.charge_types.findMany({
      where: {
        charge_type_applicability: {
          some: {
            OR: [
              {
                // Specific charges that match the given criteria
                program_level_id: query.program_level_id,
                student_type_id: query.student_type_id,
              },
              {
                // Global charges
                student_type_id: null,
                program_level_id: null,
              },
            ],
          },
        },
      },
    });
  }

  async getStudentChargeById(chargeId: string) {
    return await this.prismaService.charges.findUnique({
      where: {
        charge_id: chargeId,
      },
      include: {
        charge_types: {
          select: {
            name: true,
            description: true,
            default_amount: true,
          },
        },
        charge_statuses: {
          select: {
            name: true,
            description: true,
            charge_status_id: true,
          },
        },
        students: {
          select: {
            first_name: true,
            last_name: true,
            student_id: true,
            student_grades: {
              select: {
                program_levels: {
                  select: {
                    program_id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateStudentCharge(
    chargeId: string,
    updateChargeDto: {
      student_id: string;
      current_amount: number;
      due_date?: Date;
      description?: string;
      balanceAdjustment: number;
    },
  ) {
    //If due_date and description are not present, update only the current_amount of the charge and the student balance, if the balanceAdjustment is greater than 0, increment the balance, otherwise decrement it. Create a prisma transaction to update the charge and the student balance

    return await this.prismaService.$transaction([
      this.prismaService.charges.update({
        where: {
          charge_id: chargeId,
        },
        data: {
          current_amount: updateChargeDto.current_amount,
          due_date: updateChargeDto.due_date,
          description: updateChargeDto.description,
        },
      }),
      this.prismaService.student_balance.update({
        where: {
          student_id: updateChargeDto.student_id,
        },
        data: {
          balance: {
            [updateChargeDto.balanceAdjustment > 0 ? 'increment' : 'decrement']:
              Math.abs(updateChargeDto.balanceAdjustment),
          },
        },
      }),
    ]);
  }

  async totalAmountOwedVsBalance(studentId: string): Promise<{
    totalAmountOwed: number;
    studentBalance: number;
  }> {
    //Get the total amount owed by the student and the student balance
    const totalAmountOwedResult = await this.prismaService.charges.aggregate({
      where: {
        student_id: studentId,
        charge_status_id: {
          in: [ChargeStatuses.PENDING],
        },
      },
      _sum: {
        current_amount: true,
      },
    });

    const totalAmountOwed = Number(
      totalAmountOwedResult._sum.current_amount ?? 0,
    );

    const studentBalance = await this.prismaService.student_balance.findUnique({
      where: {
        student_id: studentId,
      },
      select: {
        balance: true,
      },
    });

    return {
      totalAmountOwed,
      studentBalance: Number(studentBalance?.balance ?? 0),
    };
  }

  private async handleError(error: Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new BadRequestException({
        message: 'Charge type already exists' + error.message,
        status: 400,
      });
    }
    throw new BadRequestException({
      message: 'An error occurred',
      status: 400,
    });
  }
}
