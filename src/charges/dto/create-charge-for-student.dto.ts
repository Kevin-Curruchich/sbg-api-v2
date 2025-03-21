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
