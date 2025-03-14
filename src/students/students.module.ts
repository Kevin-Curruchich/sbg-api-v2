import { Module } from '@nestjs/common';
import { StudentService } from './students.service';
import { StudentController } from './students.controller';
import { StudentsRepository } from './students.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StudentController],
  providers: [StudentService, StudentsRepository],
  exports: [StudentService],
})
export class StudentsModule {}
