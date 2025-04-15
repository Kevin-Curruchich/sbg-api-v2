import { Injectable } from '@nestjs/common';
import { StudentsRepository } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { StudentStatusConstant } from 'src/common/constants/student-status.constant';

import * as dayjs from 'dayjs';
//days

import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';
import User from 'src/auth/interfaces/user.interface';
import { ValidRoles } from 'src/auth/interfaces';

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

      await this.studentRepository.createStudent(studentData);
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }
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

    const groupedGrades = Object.values(
      studentData.student_grades.reduce((acc, grade) => {
        const program = grade.program_levels.programs;
        if (!program) return acc;

        const programId = program.program_id;
        if (!acc[programId]) {
          acc[programId] = {
            program_id: programId,
            program_name: program.name,
            grades: [],
          };
        }

        acc[programId].grades.push({
          program_level_id: grade.program_levels.program_level_id,
          program_level_name: grade.program_levels.name,
          created_at: dayjs(grade.program_levels.created_at).format(
            'MMMM DD, YYYY',
          ),
        });

        return acc;
      }, {}),
    );

    const data = {
      ...studentData,
      birthday: dayjs(studentData.birthday).format('YYYY-MM-DD'),
      birthdayFormatted: dayjs(studentData.birthday).format('MMMM DD, YYYY'),
      groupedGrades,
    };

    delete data.student_grades;

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

  getStudentGeneralInfo(studentId: string) {
    return this.studentRepository.getStudentGeneralInfo(studentId);
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }

  async getStudentsCount(programs: string[]) {
    return await this.studentRepository.getStudentsCount(programs);
  }
}
