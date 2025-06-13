import { Prisma, student_grade_status_enum } from '@prisma/client';
import { HttpException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  assignStudentToProgramLevelRepositoryDto,
  AssignStudentToProgramRepositoryDto,
} from './dto/assign-student-to-grade.dto';

@Injectable()
export class GradesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async assignStudentToProgram(
    assignationData: AssignStudentToProgramRepositoryDto,
  ) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const studentProgramCreated = await prisma.student_programs.create({
          data: {
            student_id: assignationData.student_id,
            program_id: assignationData.program_id,
            student_type_id: assignationData.student_type_id,
            student_program_code: assignationData.student_program_code,
          },
        });

        await prisma.students.update({
          where: { student_id: assignationData.student_id },
          data: {
            student_type_id: assignationData.student_type_id,
          },
        });

        return studentProgramCreated;
      });
    } catch (error) {
      console.log(error);
      this.handleErrors(error);
    }
  }

  async assignStudentToProgramLevel(
    assignationData: assignStudentToProgramLevelRepositoryDto,
  ) {
    try {
      return await this.prismaService.student_grades.create({
        data: {
          student_id: assignationData.student_id,
          program_level_id: assignationData.program_level_id,
          student_grade_status_id: student_grade_status_enum.regular,
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async assignedStudentsToProgramCount(
    programId: string,
    startDate: Date = new Date(),
    endDate: Date = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1),
    ),
  ) {
    try {
      return await this.prismaService.student_programs.count({
        where: {
          program_id: programId,
          created_at: {
            gte: startDate,
            lt: endDate,
          },
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getStudentPrograms(studentId: string) {
    try {
      return await this.prismaService.student_programs.findMany({
        where: { student_id: studentId },
        include: {
          programs: {
            select: {
              program_id: true,
              name: true,
            },
          },
          student_types: {
            select: {
              student_type_id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getStudentProgramLevels(studentId: string, programId: string) {
    try {
      return await this.prismaService.student_grades.findMany({
        where: {
          student_id: studentId,
          program_levels: {
            program_id: programId,
          },
        },
        select: {
          student_grade_id: true,
          created_at: true,
          start_date: true,
          end_date: true,
          enrollments: {
            select: {
              created_at: true,
              updated_at: true,
              enrollment_id: true,
              enrollment_date: true,
              enrollment_statuses: {
                select: {
                  name: true,
                  enrollment_status_id: true,
                },
              },
            },
          },
          program_levels: {
            select: {
              program_level_id: true,
              name: true,
            },
          },
          student_grade_statuses: {
            select: {
              student_grade_status_id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  private handleErrors(error: Prisma.PrismaClientKnownRequestError | Error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new HttpException(
        {
          status: error.code,
          message: error.message,
        },
        400,
      );
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}
