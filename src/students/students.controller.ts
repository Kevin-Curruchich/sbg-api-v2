import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';

import { Public } from 'src/auth/decorators/public.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

@Controller('students')
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Post()
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Get()
  getAllStudents(
    @Query()
    paginationQuery: GetStudentsPaginationQueryDto,
    @GetUser() user: User,
  ) {
    return this.studentService.getAllStudents(paginationQuery, user);
  }

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Get('types')
  getStudentTypes(@GetUser() user: User) {
    return this.studentService.getStudentTypes(user);
  }

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Get('list')
  getStudentList(
    @Query() getStudentsQueryDto: GetStudentsQueryDto,
    @GetUser() user: User,
  ) {
    return this.studentService.getAllStudentsList(getStudentsQueryDto, user);
  }

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.getStudentById(id);
  }

  @Get('identifier')
  @Public() // Remove role restrictions to make it public
  getStudentByIdentifier(@Query('term') term: string) {
    return this.studentService.getStudentByIdentifier(term);
  }

  @Auth(ValidRoles.admin, ValidRoles.superuser)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }
}
