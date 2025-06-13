import { PartialType } from '@nestjs/swagger';
import { AssignStudentToProgramDto } from './assign-student-to-grade.dto';

export class UpdateGradeDto extends PartialType(AssignStudentToProgramDto) {}
