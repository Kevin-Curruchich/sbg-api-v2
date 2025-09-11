import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

import { GradesService } from './grades.service';

import {
  CreateStudentEnrollmentDto,
  UpdateStudentEnrollmentDto,
} from './dto/create-student-enrollment.dto';

import {
  AssignStudentToProgramDto,
  assignStudentToProgramLevelDto,
} from './dto/assign-student-to-grade.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('level/:studentGradeId/student/:studentId/enrollment')
  enrollStudentInProgramLevel(
    @Param('studentId') studentId: string,
    @Param('studentGradeId') studentGradeId: string,
    @Body() createEnrollmentDto: CreateStudentEnrollmentDto,
  ) {
    return this.gradesService.enrollStudentInProgramLevel(
      studentId,
      studentGradeId,
      createEnrollmentDto,
    );
  }

  @Post('enrollment/:enrollmentId/evidence')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB file size limit
      fileFilter: (_, file, callback) => {
        // Check file type
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
          return callback(
            new Error('Only JPG and PNG image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadEnrollmentEvidence(
    @Param('enrollmentId') enrollmentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.gradesService.uploadEnrollmentEvidence(enrollmentId, file);
  }

  @Get('enrollment/:enrollmentId')
  getEnrollmentDetails(@Param('enrollmentId') enrollmentId: string) {
    return this.gradesService.getEnrollmentDetails(enrollmentId);
  }

  @Get(':studentGradeId/enrollments')
  getStudentGradeEnrollments(@Param('studentGradeId') studentGradeId: string) {
    return this.gradesService.getStudentGradeEnrollments(studentGradeId);
  }

  @Put('enrollment/:enrollmentId')
  updateEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateEnrollmentDto: UpdateStudentEnrollmentDto,
  ) {
    return this.gradesService.updateStudentEnrollment(
      enrollmentId,
      updateEnrollmentDto,
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

  @Get('report')
  async downloadStudentGradesReport(@Res() res: Response) {
    const reportBuffer = await this.gradesService.generateStudentGradesReport();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=student-grades-report.xlsx',
    );
    res.send(reportBuffer);
  }
}
