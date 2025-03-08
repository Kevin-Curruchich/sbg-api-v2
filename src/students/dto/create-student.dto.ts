import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  document_id: string;

  @IsEmail()
  email: string;

  @IsString()
  phone_number: string;

  @IsString()
  address: string;

  @IsDateString()
  birthday: Date;

  @IsString()
  student_type_id: string;

  @IsString()
  @IsOptional()
  program_level_id: string;

  @IsDateString()
  start_date: Date;
}
