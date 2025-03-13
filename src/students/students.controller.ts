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
import { StudentService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';
import { GetStudentsQueryDto } from './dto/get-students-query.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get()
  getAllStudents(@Query() paginationQuery: PaginationQueryDTO) {
    return this.studentService.getAllStudents(paginationQuery);
  }

  @Get('list')
  getStudentList(@Query() getStudentsQueryDto: GetStudentsQueryDto) {
    return this.studentService.getAllStudentsList(getStudentsQueryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.getStudentById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }
}
