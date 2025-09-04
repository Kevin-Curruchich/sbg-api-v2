import { Prisma } from '@prisma/client';
import { HttpException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  assignStudentToProgramLevelRepositoryDto,
  AssignStudentToProgramRepositoryDto,
} from './dto/assign-student-to-grade.dto';
import { GradeLevelStatuses } from 'src/common/constants/grade-levels.constant';
import { CreateStudentEnrollmentDto } from './dto/create-student-enrollment.dto';
import { EnrollmentStatusConstants } from './constants/enroment-status.constant';
import { EnrollmentCourseTypesConstants } from './constants/enroment-course-types.constant';

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
          student_grade_status_id: GradeLevelStatuses.REGULAR,
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
        orderBy: {
          start_date: 'desc',
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getCreditsAndDefaultAmountOfCourses(courses: string[]) {
    try {
      const courseData = await this.prismaService.courses.findMany({
        where: {
          course_id: {
            in: courses,
          },
        },
        select: {
          course_id: true,
          credits: true,
          price: true,
          program_id: true,
          name: true,
        },
      });

      return courseData;
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getProgramsFromCoursesId(coursesId: string[]) {
    try {
      return await this.prismaService.courses.findMany({
        where: {
          course_id: {
            in: coursesId,
          },
        },
        select: {
          program_id: true,
          programs: true,
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async enrollStudentInProgramLevel(
    student_id: string,
    student_grade_id: string,
    studentEnrollment: CreateStudentEnrollmentDto,
  ) {
    try {
      const { term_id, enrollment_date, courses } = studentEnrollment;

      return await this.prismaService.$transaction(async (prisma) => {
        const enrollment = await prisma.enrollments.create({
          data: {
            student_id,
            term_id,
            student_grade_id,
            enrollment_date,
            description: studentEnrollment.description,
            enrollment_status_id: EnrollmentStatusConstants.ACTIVE,
          },
        });

        const coursePromises = courses.map((course) =>
          prisma.enrollment_courses.create({
            data: {
              enrollment_id: enrollment.enrollment_id,
              course_id: course.course_id,
              enrollment_course_type_id:
                course?.enrollment_course_type_id ||
                EnrollmentCourseTypesConstants.REGULAR,
            },
          }),
        );

        await Promise.all(coursePromises);

        return enrollment;
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async updateStudentEnrollment(
    enrollment_id: string,
    updateData: Partial<CreateStudentEnrollmentDto>,
  ) {
    try {
      const { courses, ...enrollmentFields } = updateData;

      return await this.prismaService.$transaction(async (prisma) => {
        // Update enrollment fields
        const updatedEnrollment = await prisma.enrollments.update({
          where: { enrollment_id },
          data: {
            term_id: enrollmentFields.term_id,
            enrollment_date: enrollmentFields.enrollment_date,
            description: enrollmentFields.description,
          },
        });

        // Delete and create courses provided
        if (courses && Array.isArray(courses)) {
          // Delete existing courses for this enrollment
          await prisma.enrollment_courses.deleteMany({
            where: { enrollment_id },
          });

          const coursePromises = courses.map((course) =>
            prisma.enrollment_courses.create({
              data: {
                enrollment_id,
                course_id: course.course_id,
                enrollment_course_type_id:
                  course?.enrollment_course_type_id ||
                  EnrollmentCourseTypesConstants.REGULAR,
              },
            }),
          );
          await Promise.all(coursePromises);
        }

        return updatedEnrollment;
      });
    } catch (error) {
      console.log(error);
      this.handleErrors(error);
    }
  }

  async getStudentEnrollment(enrollment_id: string) {
    try {
      return await this.prismaService.enrollments.findUnique({
        where: { enrollment_id },
        include: {
          enrollment_courses: {
            include: {
              courses: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getStudentGradeEnrollments(studentGradeId: string) {
    try {
      return await this.prismaService.enrollments.findMany({
        where: { student_grade_id: studentGradeId },
        include: {
          enrollment_courses: {
            include: {
              courses: {
                select: {
                  course_id: true,
                  name: true,
                  description: true,
                  credits: true,
                  price: true,
                },
              },
            },
          },
          terms: {
            select: {
              term_id: true,
              term_name: true,
            },
          },
          enrollment_statuses: {
            select: {
              enrollment_status_id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async getEnrollmentDetails(enrollmentId: string) {
    return await this.prismaService.enrollments.findUnique({
      where: { enrollment_id: enrollmentId },
      include: {
        enrollment_courses: {
          include: {
            courses: true,
          },
        },
        terms: true,
        enrollment_statuses: true,
        enrollment_charges: {
          select: {
            charges: {
              select: {
                charge_types: true,
              },
            },
          },
        },
      },
    });
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
      console.error(error);
      throw new Error('An unexpected error occurred');
    }
  }
}
