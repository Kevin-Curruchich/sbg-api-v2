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
import { UpdateStudentDto } from './dto/update-student.dto';

interface StudentsFilterOptions {
  userId?: string;
}

@Injectable()
export class StudentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createStudent(data: CreateStudentDto) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const student = await prisma.students.create({
          data,
        });

        return student;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateStudent(studentId: string, updateStudentDto: UpdateStudentDto) {
    try {
      return await this.prismaService.students.update({
        where: {
          student_id: studentId,
        },
        data: {
          ...updateStudentDto,
          birthday: updateStudentDto.birthday
            ? new Date(updateStudentDto.birthday)
            : undefined,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async changeStudentStatus(studentId: string, studentStatusId: string) {
    try {
      return await this.prismaService.students.update({
        where: {
          student_id: studentId,
        },
        data: {
          student_status_id: studentStatusId,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentsCreatedByYear(
    currentYear: number = new Date().getFullYear(),
  ) {
    try {
      return await this.prismaService.students.count({
        where: {
          created_at: {
            gte: new Date(`${currentYear}-01-01`),
            lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentById(studentId: string) {
    try {
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

          student_statuses: {
            select: {
              student_status_id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  getStudentByIdentifier(term: string) {
    try {
      return this.prismaService.students.findFirst({
        where: {
          OR: [
            {
              document_id: {
                contains: term,
              },
            },
          ],
        },
        select: {
          student_id: true,
          first_name: true,
          last_name: true,
          email: true,
          document_id: true,
          phone_number: true,
          address: true,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentGeneralInfo(studentId: string) {
    try {
      return await this.prismaService.students.findUnique({
        where: {
          student_id: studentId,
        },
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
            },
          },
          student_statuses: {
            select: {
              student_status_id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getLastStudentGrade(studentId: string) {
    try {
      return await this.prismaService.student_grades.findFirst({
        where: {
          student_id: studentId,
        },
        include: {
          program_levels: {
            select: {
              program_level_id: true,
              name: true,
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
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentPrograms(studentId: string) {
    try {
      return await this.prismaService.student_programs.findMany({
        where: {
          student_id: studentId,
        },
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
      this.handleError(error);
    }
  }

  async getAllStudentsPaginated(
    getStudentsQuery: GetStudentsPaginationQueryDto,
    programs: string[] | null,
  ) {
    const {
      program_id,
      program_level_id,
      student_status_id,
      student_type_id,
      searchTerm,
    } = getStudentsQuery;

    const whereClause: Prisma.studentsWhereInput = {
      student_status_id: student_status_id || undefined,
      student_type_id: student_type_id || undefined,
    };

    if (program_level_id) {
      whereClause.OR = [
        {
          student_grades: {
            some: {
              program_level_id,
            },
          },
        },
      ];
    }

    if (program_id) {
      whereClause.student_types = {
        program_id,
      };
    } else if (programs && programs.length > 0) {
      whereClause.OR = [
        {
          student_types: {
            program_id: {
              in: programs,
            },
          },
        },
        {
          student_programs: {
            some: {
              program_id: {
                in: programs,
              },
            },
          },
        },
      ];
    }

    if (searchTerm) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND)
          ? whereClause.AND
          : whereClause.AND
            ? [whereClause.AND]
            : []),
        {
          OR: [
            { first_name: { contains: searchTerm, mode: 'insensitive' } },
            { last_name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
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
            take: 1, // Get only the last grade
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
    const { student_status_id = StudentStatusConstant.ACTIVE, searchTerm } =
      studentsQuery;

    const whereClause: Prisma.studentsWhereInput = {
      student_status_id,
      AND: {
        student_status_id,
      },
    };

    if (studentsQuery?.program_id) {
      whereClause.student_programs = {
        some: {
          program_id: studentsQuery.program_id,
        },
      };
    }

    if (studentsQuery?.student_type_id) {
      whereClause.student_type_id = studentsQuery.student_type_id;
    }

    if (studentsQuery?.program_level_id) {
      whereClause.student_grades = {
        some: {
          program_level_id: studentsQuery.program_level_id,
          student_grade_status_id: GradeLevelStatuses.REGULAR,
        },
      };
    }

    // If no program_id or program_level_id is provided, we filter by default all students because is a super user or academic
    if (!studentsQuery?.program_id && !studentsQuery?.program_level_id) {
      if (programs.length > 0) {
        whereClause.student_programs = {
          some: {
            program_id: {
              in: programs,
            },
          },
        };
      } else {
        delete whereClause.student_programs;
        delete whereClause.student_grades;
      }
    }

    if (searchTerm) {
      whereClause.AND = [
        ...(Array.isArray(whereClause.AND)
          ? whereClause.AND
          : whereClause.AND
            ? [whereClause.AND]
            : []),
        {
          OR: [
            { first_name: { contains: searchTerm, mode: 'insensitive' } },
            { last_name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
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
          },
        },
        student_programs: {
          select: {
            student_types: {
              select: {
                student_type_id: true,
                name: true,
              },
            },
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
          take: 1, // Get only the last grade
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

  async getStudentsCount(programs: string[] | null) {
    const whereClause: Prisma.studentsWhereInput = {
      student_status_id: StudentStatusConstant.ACTIVE,
    };

    if (programs && programs.length > 0) {
      whereClause.OR = [
        {
          student_types: {
            program_id: {
              in: programs,
            },
          },
        },
        {
          student_programs: {
            some: {
              program_id: {
                in: programs,
              },
            },
          },
        },
      ];
    }

    return await this.prismaService.students.count({
      where: whereClause,
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
