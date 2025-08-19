import { ConflictException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

import User from 'src/auth/interfaces/user.interface';
import { ValidRoles } from 'src/auth/interfaces';

import { StudentStatusConstant } from 'src/common/constants/student-status.constant';

import { StudentsRepository } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: StudentsRepository) {}

  async createStudent(createStudentDto: CreateStudentDto) {
    try {
      const studentData = {
        ...createStudentDto,
        birthday: dayjs(createStudentDto.birthday).toDate(),
        student_status_id: StudentStatusConstant.ACTIVE,
      };

      return await this.studentRepository.createStudent(studentData);
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }
  }

  async updateStudent(studentId: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepository.getStudentById(studentId);

    if (!student) {
      throw new ConflictException(
        `Student with ID ${studentId} does not exist.`,
      );
    }

    return await this.studentRepository.updateStudent(
      studentId,
      updateStudentDto,
    );
  }

  async inactivateStudent(studentId: string) {
    const student = await this.studentRepository.getStudentById(studentId);

    if (!student) {
      throw new ConflictException(
        `Student with ID ${studentId} does not exist.`,
      );
    }

    return await this.studentRepository.changeStudentStatus(
      studentId,
      StudentStatusConstant.INACTIVE,
    );
  }

  async reactivateStudent(studentId: string) {
    const student = await this.studentRepository.getStudentById(studentId);

    if (!student) {
      throw new ConflictException(
        `Student with ID ${studentId} does not exist.`,
      );
    }

    return await this.studentRepository.changeStudentStatus(
      studentId,
      StudentStatusConstant.ACTIVE,
    );
  }

  async getAllStudents(
    paginationQuery: GetStudentsPaginationQueryDto,
    user: User,
  ) {
    const { admin_programs } = user;

    const programs = admin_programs.map((program) => program.program_id);

    return await this.studentRepository.getAllStudentsPaginated(
      paginationQuery,
      programs,
    );
  }

  async getAllStudentsList(studentsQuery: GetStudentsQueryDto, user: User) {
    const { admin_programs } = user;

    const programs = admin_programs.map((program) => program.program_id);

    return await this.studentRepository.getAllStudentsList(
      studentsQuery,
      programs,
    );
  }

  async getStudentsCreatedByYear(
    currentYear: number = new Date().getFullYear(),
  ) {
    return await this.studentRepository.getStudentsCreatedByYear(currentYear);
  }

  async getStudentTypes(user: User) {
    let options = null;

    if (user.role_id === ValidRoles.admin) {
      options = {
        userId: user.user_id,
      };
    }

    return await this.studentRepository.getStudentTypes(options);
  }

  async getStudentById(id: string) {
    const studentData = await this.studentRepository.getStudentById(id);

    const data = {
      ...studentData,
      birthday: dayjs(studentData.birthday).format('YYYY-MM-DD'),
      birthdayFormatted: dayjs(studentData.birthday).format('MMMM DD, YYYY'),
    };

    return data;
  }

  async getStudentByIdentifier(term: string) {
    const studentData =
      await this.studentRepository.getStudentByIdentifier(term);

    if (!studentData) {
      return null;
    }

    return studentData;
  }

  getLastStudentGrade(studentId: string) {
    return this.studentRepository.getLastStudentGrade(studentId);
  }

  getStudentGrades(studentId: string) {
    return this.studentRepository.getStudentPrograms(studentId);
  }

  getStudentGeneralInfo(studentId: string) {
    return this.studentRepository.getStudentGeneralInfo(studentId);
  }

  async getStudentsCount(programs: string[]) {
    return await this.studentRepository.getStudentsCount(programs);
  }

  async generateStudentReport(
    queryFilters: GetStudentsQueryDto,
    user: User,
  ): Promise<Buffer> {
    const { admin_programs } = user;

    const programs = admin_programs.map((program) => program.program_id);

    const students = await this.studentRepository.getAllStudentsList(
      queryFilters,
      programs,
    );

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'ID', key: 'student_id', width: 0 },
      { header: 'Nombre', key: 'full_name', width: 30 },
      { header: 'Correo', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 30 },
      { header: 'Último programa', key: 'last_program', width: 25 },
      { header: 'Último nivel', key: 'last_level', width: 25 },
      { header: 'Tipo Estudiante', key: 'student_type', width: 25 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    students.forEach((student) => {
      worksheet.addRow({
        student_id: student.student_id,
        full_name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        phone: student.phone_number,
        last_program: student.student_programs[0]?.programs.name || '',
        last_level: student.student_grades[0]?.program_levels.name || '',
        student_type: student.student_types.name,
        status: student.student_types.name,
      });
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
}
