import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';

import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';
import { GradeLevelStatuses } from 'src/common/constants/grade-levels.constant';
import { CreateStudentDto } from './dto/create-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudent(data: CreateStudentDto) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const { start_date, program_level_id, ...studentData } = data;

        const student = await prisma.students.create({
          data: studentData,
        });

        await prisma.student_grades.create({
          data: {
            student_id: student.student_id,
            program_level_id: program_level_id,
            start_date,
            student_grade_status_id: GradeLevelStatuses.REGULAR,
          },
        });

        return student;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentById(studentId: string) {
    return await this.prismaService.students.findUnique({
      where: {
        student_id: studentId,
      },
    });
  }

  async getAllStudentsPaginated(paginationQuery: PaginationQueryDTO) {
    const { data, total } = await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.students
    >(
      this.prismaService.students,
      {
        include: {
          student_types: {
            select: {
              student_type_id: true,
              name: true,
            },
          },
          student_statuses: {
            select: {
              student_status_id: true,
              name: true,
            },
          },
          student_grades: {
            select: {
              program_levels: {
                include: {
                  programs: {
                    select: {
                      program_id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      },
      {
        page: paginationQuery.page,
        take: paginationQuery.take,
      },
    );
    return { data, total };
  }

  private handleError(error: Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new BadRequestException(
        `Student with document ID ${error.meta.target[0]} already exists`,
      );
    }
    throw new Error(error.message);
  }
}
