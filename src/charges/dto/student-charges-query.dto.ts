import { IsDateString, IsOptional, IsString } from 'class-validator';

export class StudentChargesQueryDto {
  @IsOptional()
  @IsString()
  charge_status_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}

export class StudentChargeRepositoryDto extends StudentChargesQueryDto {
  due_date_start?: Date;
  due_date_end?: Date;
}
