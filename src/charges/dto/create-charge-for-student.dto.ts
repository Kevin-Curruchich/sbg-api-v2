import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateForStudentChargeDto {
  @IsString()
  student_id: string;

  @IsString()
  charge_type_id: string;

  @IsNumber()
  original_amount: number;

  @IsDateString()
  due_date: Date;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateForStudentChargeRepositoryDto extends CreateForStudentChargeDto {
  charge_status_id: string;
}

export class CreateForStudentsChargeDto {
  @IsString({ each: true })
  student_ids: string[];

  @IsString()
  charge_type_id: string;

  @IsNumber()
  original_amount: number;

  @IsDateString()
  due_date: Date;

  @IsOptional()
  @IsString()
  description?: string;
}
