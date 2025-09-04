import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesRepository } from './courses.repository';
import { GetCourseDto } from './dto/get-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly courseRepository: CoursesRepository) {}

  async createCourse(createCourseDto: CreateCourseDto) {
    return this.courseRepository.createCourse(createCourseDto);
  }

  async getAllCoursesPaginated(paginationQuery: GetCourseDto) {
    return this.courseRepository.findAllCoursesPagination(paginationQuery);
  }

  async getCourseById(course_id: string) {
    const courseData = await this.courseRepository.getCourseById(course_id);

    const totalCourseInEnrollments = courseData.enrollment_courses.length;

    return {
      ...courseData,
      totalCourseInEnrollments,
    };
  }

  async getCoursesByProgramIdList(program_id: string, search_term: string) {
    return this.courseRepository.getCoursesByProgramIdList(
      program_id,
      search_term,
    );
  }

  async updateCourseById(course_id: string, updateCourseDto: UpdateCourseDto) {
    return this.courseRepository.updateCourseByID(course_id, updateCourseDto);
  }

  async removeCourseById(course_id: string) {
    const courseData = await this.getCourseById(course_id);

    if (courseData.totalCourseInEnrollments) {
      throw new BadRequestException(
        'Cannot delete course with active enrollments',
      );
    }

    return this.courseRepository.removeCourseById(course_id);
  }
}
