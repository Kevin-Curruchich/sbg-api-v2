import { PartialType } from '@nestjs/swagger';
import { CreateForStudentChargeDto } from './create-charge-for-student.dto';

export class UpdateStudentChargeDto extends PartialType(
  CreateForStudentChargeDto,
) {}
