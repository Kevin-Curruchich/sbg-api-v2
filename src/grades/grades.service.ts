import { ConflictException, Injectable } from '@nestjs/common';

import * as dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import { Buffer } from 'buffer';

import { Decimal } from '@prisma/client/runtime/library';

import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

import User from 'src/auth/interfaces/user.interface';
import { ValidRoles } from 'src/auth/interfaces';

import { ProgramsService } from 'src/programs/programs.service';

import { GradesRepository } from './grades.repository';

import {
  AssignStudentToProgramDto,
  assignStudentToProgramLevelDto,
} from './dto/assign-student-to-grade.dto';
import {
  CreateStudentEnrollmentDto,
  UpdateStudentEnrollmentDto,
} from './dto/create-student-enrollment.dto';

import { ChargesService } from 'src/charges/charges.service';
import { ChargeTypesConstants } from 'src/charges/constants/charge-types.constant';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import { formatDate } from 'src/common/helpers/date.helper';
import { StorageService } from 'src/common/storage.service';

@Injectable()
export class GradesService {
  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly programsService: ProgramsService,
    private readonly chargesService: ChargesService,
    private readonly storageService: StorageService,
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

  async uploadEnrollmentEvidence(
    enrollmentId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new ConflictException('File is required');
    }

    const enrollmentDetails =
      await this.gradesRepository.getEnrollmentEvidence(enrollmentId);

    if (enrollmentDetails.length > 0) {
      // Delete previous file
      await this.storageService.deleteFile(enrollmentDetails[0].file_path);

      await this.gradesRepository.deleteEnrollmentEvidence(
        enrollmentDetails[0].enrollment_evidence_id,
      );
    }

    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueFileName = `${uuidv4()}${ext}`;
      const filePath = `enrollments/${enrollmentId}/${uniqueFileName}`;

      const fileUrl = await this.storageService.uploadFile(
        file.buffer,
        filePath,
      );

      await this.gradesRepository.createEnrollmentEvidence(
        enrollmentId,
        filePath,
      );

      return { fileUrl };
    } catch (error) {
      throw new ConflictException(`Failed to upload file: ${error.message}`);
    }
  }

  private generateTotalEnrollmentAndChargeDescription(
    coursesData: {
      program_id: string;
      name: string;
      credits: number;
      price: number | null;
      course_id: string;
    }[],
    programsData: {
      program_id: string;
      programs: {
        program_id: string;
        name: string;
        description: string;
        created_at: Date;
        updated_at: Date;
        program_code: number;
        default_price_credit: Decimal;
      };
    }[],
  ) {
    // Each course can have credits or price.
    // If the course include credits we need to search the default value per credit based on the program that the course belongs to
    // If the course include price we dont need to know the default value if the course belongs to a program with a fixed price
    // If the course selected (from DTO) has EnrollmentCourseTypesConstants.ONLY_LISTENER the price or the default value per credit only costs 50% of the price or the default value from credits
    // The total enrollment charge will depend on the courses selected and their respective pricing models
    // We need to calculate the total based on the course data and the program data
    // Example: If a course has 3 credits and the program's default price per credit is $100, the total for that course would be $300.
    // If some course selected has a fixed price of $500, we use that instead.
    // If some course selected has 3 credits and the default price per credit is %100 and includes EnrollmentCourseTypesConstants.ONLY_LISTENER the price or the default value per credit only costs 50% of the price or the default value from credits
    // The total of the enrollment charge will be $950 be we have 1 course with 3 credits ($300); 1 course with a fixed price of $500 and 1 course with 3 credits and ONLY_LISTENER type ($150).

    const totalEnrollmentCharge = coursesData.reduce((total, course) => {
      const program = programsData.find(
        (p) => p.program_id === course.program_id,
      );
      if (program) {
        if (course.credits) {
          const pricePerCredit =
            program.programs.default_price_credit.toNumber();
          total += course.credits * pricePerCredit;
        } else if (course.price) {
          total += course.price;
        }
      }
      return total;
    }, 0);

    const enrollmentChargeDescription = `Total matricula ${totalEnrollmentCharge} por la asignacion de ${coursesData.map((course) => course.name).join(', ')}`;

    return { totalEnrollmentCharge, enrollmentChargeDescription };
  }

  async enrollStudentInProgramLevel(
    student_id: string,
    student_grade_id: string,
    studentEnrollment: CreateStudentEnrollmentDto,
  ) {
    const enrollment = await this.gradesRepository.enrollStudentInProgramLevel(
      student_id,
      student_grade_id,
      { ...studentEnrollment, enrollment_date: dayjs().toISOString() },
    );

    const chargeForEnrollment =
      await this.chargesService.createChargeForStudent({
        student_id,
        charge_type_id: ChargeTypesConstants.ENROLLMENT,
        original_amount: studentEnrollment.enrollment_charge_total,
        due_date: dayjs(studentEnrollment.enrollment_date).toDate(),
        description: studentEnrollment.enrollment_charge_description,
        description_transaction_balance: `Cargo por matrícula de ${student_id} para matrícula en ${enrollment.enrollment_id}`,
      });

    await this.chargesService.asignChargeToEnrollment(
      enrollment.enrollment_id,
      chargeForEnrollment[0].charge_id,
    );

    if (studentEnrollment.include_registration) {
      const chargeForRegistration =
        await this.chargesService.createChargeForStudent({
          student_id,
          charge_type_id: ChargeTypesConstants.INSCRIPTION,
          original_amount: 250,
          due_date: new Date(),
          description: 'Inscripcion de estudiante',
          description_transaction_balance: `Cargo por inscripción de ${student_id} para matrícula en ${enrollment.enrollment_id}`,
        });

      await this.chargesService.asignChargeToEnrollment(
        enrollment.enrollment_id,
        chargeForRegistration[0].charge_id,
      );
    }

    return {
      enrollment,
      chargeForEnrollment,
    };
  }

  async updateStudentEnrollment(
    enrollment_id: string,
    updateData: UpdateStudentEnrollmentDto,
  ) {
    await this.gradesRepository.updateStudentEnrollment(enrollment_id, {
      ...updateData,
      enrollment_date: dayjs(updateData.enrollment_date).toISOString(),
    });

    const enrollmentData =
      await this.gradesRepository.getEnrollmentDetails(enrollment_id);

    const chargesFromEnrollment =
      await this.chargesService.getChargesFromEnrollmentId(enrollment_id);

    // Update enrollment charge
    for (const charge of chargesFromEnrollment) {
      const { charge_type_id } = charge.charges;

      if (charge_type_id === ChargeTypesConstants.ENROLLMENT) {
        await this.chargesService.updateChargeStudent(charge.charge_id, {
          original_amount: updateData.enrollment_charge_total,
          description: updateData.enrollment_charge_description,
        });
      }

      if (charge_type_id === ChargeTypesConstants.INSCRIPTION) {
        if (!updateData.include_registration) {
          // Registration charge should be removed
          await this.chargesService.updateChargeStudent(charge.charge_id, {
            original_amount: 0,
            description: 'Cargo por inscripción eliminado',
          });
          await this.chargesService.updateChargeStatus(charge.charge_id, {
            charge_status_id: ChargeStatuses.TOTAL_PAID,
          });
        } else {
          // Registration charge should be updated
          await this.chargesService.updateChargeStudent(charge.charge_id, {
            original_amount: 250,
            description: 'Inscripcion de estudiante',
            description_transaction_balance: `Cargo por inscripción para matrícula en ${enrollment_id}`,
          });
        }
      }
    }

    // If registration is included but no charge exists, create it
    const hasRegistrationCharge = chargesFromEnrollment.some(
      (charge) =>
        charge.charges.charge_type_id === ChargeTypesConstants.INSCRIPTION,
    );

    if (updateData.include_registration && !hasRegistrationCharge) {
      const chargeForRegistration =
        await this.chargesService.createChargeForStudent({
          student_id: enrollmentData.student_id,
          charge_type_id: ChargeTypesConstants.INSCRIPTION,
          original_amount: 250,
          due_date: new Date(),
          description: 'Inscripcion de estudiante',
          description_transaction_balance: `Cargo por inscripción para matrícula en ${enrollment_id}`,
        });

      await this.chargesService.asignChargeToEnrollment(
        enrollment_id,
        chargeForRegistration[0].charge_id,
      );
    }

    return enrollmentData;
  }

  async getStudentGradeEnrollments(studentGradeId: string) {
    const enrollments =
      await this.gradesRepository.getStudentGradeEnrollments(studentGradeId);

    const enhancedEnrollments = enrollments.map((enrollment) => ({
      enrollment_id: enrollment.enrollment_id,
      term: enrollment.terms,
      enrollment_date: formatDate(enrollment.enrollment_date, 'YYYY-MM-DD'),
      enrollment_date_for: formatDate(enrollment.enrollment_date, 'DD/MM/YYYY'),
      enrollment_status: enrollment.enrollment_statuses,
      enrollment_courses: enrollment.enrollment_courses.map(
        (enrollmentCourse) => ({
          course_id: enrollmentCourse.course_id,
          course: enrollmentCourse.courses,
        }),
      ),
      description: enrollment.description,
    }));

    return enhancedEnrollments;
  }

  async getEnrollmentDetails(enrollmentId: string) {
    const enrollmentDetails =
      await this.gradesRepository.getEnrollmentDetails(enrollmentId);

    const include_registration = enrollmentDetails.enrollment_charges.some(
      (enrollmentCharge) =>
        enrollmentCharge.charges.charge_types.charge_type_id ===
        ChargeTypesConstants.INSCRIPTION,
    );

    const enrollment_charge_total = enrollmentDetails.enrollment_charges.find(
      (enrollmentCharge) =>
        enrollmentCharge.charges.charge_types.charge_type_id ===
        ChargeTypesConstants.ENROLLMENT,
    )?.charges.current_amount;

    let enrollmentEvidence = null;

    if (enrollmentDetails?.enrollment_evidence?.length > 0) {
      enrollmentEvidence = await this.storageService.getFileUrl(
        enrollmentDetails?.enrollment_evidence[0]?.file_path || '',
      );
    }

    const enrollmentDetailsEnhanced = {
      enrollment_id: enrollmentDetails.enrollment_id,
      term: enrollmentDetails.terms,
      enrollment_date: formatDate(
        enrollmentDetails.enrollment_date,
        'YYYY-MM-DD',
      ),
      enrollment_date_for: formatDate(
        enrollmentDetails.enrollment_date,
        'DD/MM/YYYY',
      ),
      enrollment_status: enrollmentDetails.enrollment_statuses,
      enrollment_courses: enrollmentDetails.enrollment_courses.map(
        (enrollmentCourse) => ({
          course_id: enrollmentCourse.course_id,
          course: enrollmentCourse.courses,
          enrollment_course_type_id: enrollmentCourse.enrollment_course_type_id,
        }),
      ),
      include_registration,
      description: enrollmentDetails.description,
      enrollment_evidence: enrollmentEvidence,
      credits: enrollmentDetails.credits,
      enrollment_charge_total: enrollment_charge_total || 0,
    };

    return enrollmentDetailsEnhanced;
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
