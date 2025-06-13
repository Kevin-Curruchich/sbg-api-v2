import { IsString } from 'class-validator';

export class AssignStudentToProgramDto {
  @IsString()
  program_id: string;

  @IsString()
  student_type_id: string;
}

export class AssignStudentToProgramRepositoryDto extends AssignStudentToProgramDto {
  student_id: string;

  student_program_code: string;
}

export class assignStudentToProgramLevelDto {
  @IsString()
  program_level_id: string;
}

export class assignStudentToProgramLevelRepositoryDto extends assignStudentToProgramLevelDto {
  student_id: string;
}
