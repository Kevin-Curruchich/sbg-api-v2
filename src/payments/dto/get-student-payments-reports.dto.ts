import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetStudentsPaymentsReportsDto {
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsUUID()
  program_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'end_date is required when start_date is provided',
    },
  )
  end_date?: Date;
}
