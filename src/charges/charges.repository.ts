import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import StudentChargesQueryDto from './dto/student-charges-query.dto';

@Injectable()
export class ChargesRepository {
  constructor(private readonly prismaService: PrismaService) {}

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
    chargesQuery: StudentChargesQueryDto,
  ) {
    const { due_date } = chargesQuery;

    const studentCharges = await this.prismaService.charges.findMany({
      where: {
        student_id: studentId,
        charge_status_id: chargesQuery.charge_status_id,
        due_date: due_date
          ? {
              gte: due_date,
              lte: new Date(),
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
