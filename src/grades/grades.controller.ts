import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

import { GradesService } from './grades.service';

import {
  AssignStudentToProgramDto,
  assignStudentToProgramLevelDto,
} from './dto/assign-student-to-grade.dto';

@Controller('grades')
@Auth(ValidRoles.admin, ValidRoles.superuser, ValidRoles.academic)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('student/:studentId/program')
  assignStudentToProgram(
    @GetUser() user: User,
    @Param('studentId') studentId: string,
    @Body() createGradeDto: AssignStudentToProgramDto,
  ) {
    return this.gradesService.assignStudentToProgram(
      studentId,
      createGradeDto,
      user,
    );
  }

  @Post('student/:studentId/program-level')
  assignStudentToProgramLevel(
    @Param('studentId') studentId: string,
    @Body() createGradeDto: assignStudentToProgramLevelDto,
  ) {
    return this.gradesService.assignStudentToProgramLevel(
      studentId,
      createGradeDto,
    );
  }

  @Get('student/:studentId/programs')
  getStudentGrades(@Param('studentId') studentId: string) {
    return this.gradesService.getStudentPrograms(studentId);
  }

  @Get('student/:studentId/program/:programId/levels')
  getStudentProgramLevels(
    @Param('studentId') studentId: string,
    @Param('programId') programId: string,
  ) {
    return this.gradesService.getStudentProgramLevels(studentId, programId);
  }
}
