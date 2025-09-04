import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentEnrollmentDto {
  @IsString()
  term_id: string;

  @IsDateString()
  enrollment_date: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => CoursesToEnrollDto)
  @ArrayMinSize(1)
  @IsOptional()
  courses: CoursesToEnrollDto[];

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
