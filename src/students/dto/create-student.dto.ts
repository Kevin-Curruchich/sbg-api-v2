import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  sex: number;

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
}

export class AssignStudentToProgramDto {
  @IsString()
  program_id: string;

  @IsString()
  student_type_id: string;
}
