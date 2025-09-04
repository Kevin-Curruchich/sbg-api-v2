import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  program_id?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  price?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  credits?: number;
}
