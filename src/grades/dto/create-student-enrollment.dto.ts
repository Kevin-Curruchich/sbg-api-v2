import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentEnrollmentDto {
  @IsString()
  term_id: string;

  @IsNumber()
  credits: number;

  @IsDateString()
  enrollment_date: string;

  @IsNumber()
  enrollment_charge_total: number;

  @IsString()
  @IsOptional()
  enrollment_charge_description?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  include_registration: boolean;
}

export class CoursesToEnrollDto {
  @IsString()
  course_id: string;

  @IsString()
  enrollment_course_type_id: string;
}

export class UpdateStudentEnrollmentDto extends PartialType(
  CreateStudentEnrollmentDto,
) {}
