import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { GradesRepository } from './grades.repository';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProgramsModule } from 'src/programs/programs.module';
import { StudentsModule } from 'src/students/students.module';
import { ChargesModule } from 'src/charges/charges.module';

@Module({
  controllers: [GradesController],
  providers: [GradesService, GradesRepository],
  imports: [
    PrismaModule,
    AuthModule,
    ProgramsModule,
    StudentsModule,
    ChargesModule,
  ],
})
export class GradesModule {}
