import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';

import { GradeLevelStatuses } from 'src/common/constants/grade-levels.constant';
import { CreateStudentDto } from './dto/create-student.dto';
import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';

import { StudentStatusConstant } from 'src/common/constants/student-status.constant';

interface StudentsFilterOptions {
  userId?: string;
}

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
      include: {
        student_types: {
          select: {
            student_type_id: true,
            name: true,
          },
        },
        student_grades: {
          select: {
            program_levels: {
              select: {
                programs: {
                  select: {
                    name: true,
                    program_id: true,
                  },
                },
                name: true,
                program_level_id: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllStudentsPaginated(
    getStudentsQuery: GetStudentsPaginationQueryDto,
    programs: string[] | null,
  ) {
    const { program_id, program_level_id } = getStudentsQuery;

    const whereClause: Prisma.studentsWhereInput = {
      student_status_id: getStudentsQuery.student_status_id,
      student_types: {
        program_id: program_id || undefined,
        student_type_id: getStudentsQuery.student_type_id,
      },
      OR: [
        {
          student_grades: {
            some: {
              program_level_id: program_level_id || undefined,
            },
          },
        },
        {
          student_grades: {},
        },
      ],
    };

    if (!program_id && !program_level_id) {
      whereClause.student_types.program_id = undefined;
      if (programs.length > 0) {
        whereClause.student_types.programs = {
          program_id: {
            in: programs,
          },
        };
      }
    }

    const { data, total } = await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.students
    >(
      this.prismaService.students,
      {
        where: whereClause,
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
        page: getStudentsQuery.page,
        take: getStudentsQuery.take,
      },
    );
    return { data, total };
  }

  async getAllStudentsList(
    studentsQuery: GetStudentsQueryDto,
    programs: string[],
  ) {
    const {
      student_status_id = StudentStatusConstant.ACTIVE,
      student_grade_status_id = GradeLevelStatuses.REGULAR,
    } = studentsQuery;

    const whereClause: Prisma.studentsWhereInput = {
      student_status_id,
      student_types: {
        program_id: studentsQuery.program_id,
        student_type_id: studentsQuery.student_type_id,
      },
      student_grades: {
        some: {
          program_level_id: studentsQuery.program_level_id,
          student_grade_status_id,
        },
      },
      AND: {
        student_status_id,
        //not student grades empty
        NOT: {
          student_grades: {
            none: {},
          },
        },
      },
    };

    if (!studentsQuery.program_id && !studentsQuery.program_level_id) {
      whereClause.student_types.program_id = undefined;
      if (programs.length > 0) {
        whereClause.student_types.programs = {
          program_id: {
            in: programs,
          },
        };
      }
    }

    return await this.prismaService.students.findMany({
      where: whereClause,
      select: {
        student_id: true,
        first_name: true,
        last_name: true,
        email: true,
        document_id: true,
        phone_number: true,
        address: true,
        student_types: {
          select: {
            student_type_id: true,
            name: true,
            programs: {
              select: {
                program_id: true,
                name: true,
              },
            },
          },
        },
        student_grades: {
          select: {
            program_levels: {
              select: {
                program_level_id: true,
                name: true,
              },
            },
          },
          orderBy: {
            program_levels: {
              created_at: 'desc',
            },
          },
        },
      },
    });
  }

  async getStudentTypes(options?: StudentsFilterOptions | null) {
    const where: Prisma.student_typesWhereInput = {};

    if (options && options?.userId) {
      where['programs'] = {
        admin_programs: {
          some: {
            user_id: options.userId,
          },
        },
      };
    }

    return await this.prismaService.student_types.findMany({
      where,
      include: {
        programs: true,
      },
    });
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
