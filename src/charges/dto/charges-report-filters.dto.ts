import { IsOptional, IsString } from 'class-validator';

export class ChargesReportFiltersDto {
  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  studentTypeId?: string;
}
