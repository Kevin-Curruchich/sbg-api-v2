import { frequency_enum } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateChargeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  default_amount: number;

  @IsBoolean()
  is_recurring: boolean;

  @IsUUID()
  @IsOptional()
  program_id: string;

  @IsString()
  @IsIn(['term', 'monthly', 'once', 'annual'])
  frequency: frequency_enum;
}
