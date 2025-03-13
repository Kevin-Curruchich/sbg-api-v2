import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChargesRepository } from './charges.repository';
import { StudentsModule } from 'src/students/students.module';

@Module({
  imports: [PrismaModule, StudentsModule],
  controllers: [ChargesController],
  providers: [ChargesService, ChargesRepository],
  exports: [ChargesService],
})
export class ChargesModule {}
