import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChargesRepository } from './charges.repository';
import { StudentsModule } from 'src/students/students.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, StudentsModule, AuthModule],
  controllers: [ChargesController],
  providers: [ChargesService, ChargesRepository],
  exports: [ChargesService],
})
export class ChargesModule {}
