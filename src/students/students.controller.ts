import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './students.service';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';

@Controller('students')
@Auth(ValidRoles.admin, ValidRoles.superuser, ValidRoles.academic)
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Put(':studentId')
  updateStudent(
    @Param('studentId') studentId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(studentId, updateStudentDto);
  }

  @Put(':studentId/inactivate')
  inactivateStudent(@Param('studentId') studentId: string) {
    return this.studentService.inactivateStudent(studentId);
  }

  @Put(':studentId/activate')
  reactivateStudent(@Param('studentId') studentId: string) {
    return this.studentService.reactivateStudent(studentId);
  }

  @Get()
  getAllStudents(
    @Query()
    paginationQuery: GetStudentsPaginationQueryDto,
    @GetUser() user: User,
  ) {
    return this.studentService.getAllStudents(paginationQuery, user);
  }

  @Get('types')
  getStudentTypes(@GetUser() user: User) {
    return this.studentService.getStudentTypes(user);
  }

  @Get('list')
  getStudentList(
    @Query() getStudentsQueryDto: GetStudentsQueryDto,
    @GetUser() user: User,
  ) {
    return this.studentService.getAllStudentsList(getStudentsQueryDto, user);
  }

  @Get('identifier')
  @Public() // Remove role restrictions to make it public
  getStudentByIdentifier(@Query('term') term: string) {
    return this.studentService.getStudentByIdentifier(term);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.getStudentById(id);
  }
}
