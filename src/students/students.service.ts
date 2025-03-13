import { Injectable } from '@nestjs/common';
import { StudentsRepository } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { StudentStatusConstant } from 'src/common/constants/student-status.constant';

import * as dayjs from 'dayjs';
import {
  GetStudentsPaginationQueryDto,
  GetStudentsQueryDto,
} from './dto/get-students-query.dto';

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: StudentsRepository) {}

  async createStudent(createStudentDto: CreateStudentDto) {
    const studentData = {
      ...createStudentDto,
      birthday: dayjs(createStudentDto.birthday).toDate(),
      start_date: dayjs(createStudentDto.start_date).toDate(),
      student_status_id: StudentStatusConstant.ACTIVE,
    };

    await this.studentRepository.createStudent(studentData);
  }

  async getAllStudents(paginationQuery: GetStudentsPaginationQueryDto) {
    return await this.studentRepository.getAllStudentsPaginated(
      paginationQuery,
    );
  }

  async getAllStudentsList(studentsQuery: GetStudentsQueryDto) {
    return await this.studentRepository.getAllStudentsList(studentsQuery);
  }

  async getStudentById(id: string) {
    return await this.studentRepository.getStudentById(id);
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }
}
