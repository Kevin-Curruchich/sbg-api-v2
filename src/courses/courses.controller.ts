import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

import { GetCourseDto } from './dto/get-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Get()
  findAll(@Query() paginationQuery: GetCourseDto) {
    return this.coursesService.getAllCoursesPaginated(paginationQuery);
  }

  @Get('/program/:program_id')
  findAllByProgram(
    @Param('program_id') program_id: string,
    @Query('search_term') search_term: string,
  ) {
    return this.coursesService.getCoursesByProgramIdList(
      program_id,
      search_term,
    );
  }

  @Get(':id')
  findOne(@Param('id') course_id: string) {
    return this.coursesService.getCourseById(course_id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.updateCourseById(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.removeCourseById(id);
  }
}
