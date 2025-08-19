import { ConflictException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

import User from 'src/auth/interfaces/user.interface';
import { ValidRoles } from 'src/auth/interfaces';

import { ProgramsService } from 'src/programs/programs.service';
import { StudentService } from 'src/students/students.service';

import { GradesRepository } from './grades.repository';

import {
  AssignStudentToProgramDto,
  assignStudentToProgramLevelDto,
} from './dto/assign-student-to-grade.dto';

@Injectable()
export class GradesService {
  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly programsService: ProgramsService,
  ) {}

  async assignStudentToProgram(
    studentId: string,
    assignStudentProgramData: AssignStudentToProgramDto,
    user: User,
  ) {
    const { admin_programs } = user;
    const { program_id } = assignStudentProgramData;

    const programs = admin_programs.map((program) => program.program_id);

    if (!programs.includes(program_id) && user.role_id === ValidRoles.admin) {
      throw new ConflictException(
        `You do not have permission to assign students to this program.`,
      );
    }

    const program = await this.programsService.getProgramById(program_id);

    if (!program) {
      throw new ConflictException(
        `Program with ID ${program_id} does not exist.`,
      );
    }

    const currentYear = dayjs().year();

    const startOfCurrentYear = dayjs().startOf('year');
    const endOfCurrentYear = dayjs().endOf('year');

    const studentsAssignedToProgramCurrentYear =
      await this.gradesRepository.assignedStudentsToProgramCount(
        program_id,
        startOfCurrentYear.toDate(),
        endOfCurrentYear.toDate(),
      );

    const student_program_code = `${program.program_code}-${currentYear.toString().slice(-2)}-${studentsAssignedToProgramCurrentYear + 1}`;

    console.log({ student_program_code });

    const data = {
      student_id: studentId,
      program_id: assignStudentProgramData.program_id,
      student_type_id: assignStudentProgramData.student_type_id,
      student_program_code,
    };

    return await this.gradesRepository.assignStudentToProgram(data);
  }

  async assignStudentToProgramLevel(
    studentId: string,
    assignStudentProgramLevel: assignStudentToProgramLevelDto,
  ) {
    return await this.gradesRepository.assignStudentToProgramLevel({
      student_id: studentId,
      program_level_id: assignStudentProgramLevel.program_level_id,
    });
  }

  async getStudentPrograms(studentId: string) {
    return await this.gradesRepository.getStudentPrograms(studentId);
  }

  async getStudentProgramLevels(studentId: string, programId: string) {
    const data = await this.gradesRepository.getStudentProgramLevels(
      studentId,
      programId,
    );

    const enhancedData = data.map((item) => ({
      ...item,
      created_at: dayjs(item.created_at).format('YYYY-MM-DD'),
      created_at_formatted: dayjs(item.created_at).format('DD/MM/YYYY'),
      start_date: dayjs(item.start_date).format('YYYY-MM-DD'),
      start_date_formatted: dayjs(item.start_date).format('DD/MM/YYYY'),
      end_date: item.end_date
        ? dayjs(item.end_date).format('YYYY-MM-DD')
        : null,
      end_date_formatted: item.end_date
        ? dayjs(item.end_date).format('DD/MM/YYYY')
        : null,
      enrollments: item.enrollments.map((enrollment) => ({
        ...enrollment,
        created_at: dayjs(enrollment.created_at).format('YYYY-MM-DD'),
        created_at_formatted: dayjs(enrollment.created_at).format('DD/MM/YYYY'),
        updated_at: dayjs(enrollment.updated_at).format('YYYY-MM-DD'),
        updated_at_formatted: dayjs(enrollment.updated_at).format('DD/MM/YYYY'),
      })),
    }));

    return enhancedData;
  }

  async generateStudentGradesReport(): Promise<Buffer> {
    const grades = await this.gradesRepository.getStudentPrograms('');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Grades');

    worksheet.columns = [
      { header: 'Student ID', key: 'student_id', width: 20 },
      { header: 'Program', key: 'program_name', width: 30 },
      { header: 'Level', key: 'level_name', width: 20 },
    ];

    grades.forEach((grade) => {
      worksheet.addRow({
        student_id: grade.student_id,
        program_name: grade.programs.name,
        level_name: grade.student_types.name,
      });
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
}
