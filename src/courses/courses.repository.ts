import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';
import { GetCourseDto } from './dto/get-course.dto';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createCourse(createCourseDto: CreateCourseDto) {
    return this.prismaService.courses.create({
      data: createCourseDto,
    });
  }

  async findAllCoursesPagination(getCourseDto: GetCourseDto) {
    return await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.courses
    >(
      this.prismaService.courses,
      {
        where: {
          OR: [
            {
              name: {
                contains: getCourseDto.searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: getCourseDto.searchTerm,
                mode: 'insensitive',
              },
            },
          ],
          program_id: getCourseDto.program_id,
        },
        include: {
          programs: true,
        },
      },
      {
        page: getCourseDto.page,
        take: getCourseDto.take,
      },
    );
  }

  async getCoursesByProgramIdList(program_id: string, search_term: string) {
    return this.prismaService.courses.findMany({
      where: {
        OR: [{ program_id }, { program_id: null }],
        name: {
          contains: search_term,
          mode: 'insensitive',
        },
      },
      include: {
        programs: true,
      },
    });
  }

  async getCourseById(course_id: string) {
    return await this.prismaService.courses.findUnique({
      where: {
        course_id,
      },
      include: {
        enrollment_courses: true,
        programs: true,
      },
    });
  }

  async updateCourseByID(course_id: string, updateCourseDto: UpdateCourseDto) {
    return this.prismaService.courses.update({
      where: {
        course_id,
      },
      data: updateCourseDto,
    });
  }

  async removeCourseById(course_id: string) {
    return this.prismaService.courses.delete({
      where: {
        course_id,
      },
    });
  }
}
