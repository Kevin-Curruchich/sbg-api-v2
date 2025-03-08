import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

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
              decrement: data.original_amount,
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

  async getChargesByStudentId(studentId: string) {
    const studentCharges = await this.prismaService.charges.findMany({
      where: {
        student_id: studentId,
      },
      include: {
        charge_types: true,
        charge_statuses: true,
        payment_details: {
          include: {
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
