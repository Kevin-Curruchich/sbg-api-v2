import { PartialType } from '@nestjs/swagger';
import { CreateTermDto } from './create-term.dto';
import { IsUUID } from 'class-validator';

export class UpdateTermDto extends PartialType(CreateTermDto) {
  @IsUUID()
  term_status_id?: string;
}
