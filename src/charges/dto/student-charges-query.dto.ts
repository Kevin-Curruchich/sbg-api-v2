import { IsDateString, IsOptional, IsString } from 'class-validator';

export default class StudentChargesQueryDto {
  @IsOptional()
  @IsString()
  charge_status_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}
