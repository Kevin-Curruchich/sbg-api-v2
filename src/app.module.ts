import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { ConfigModule } from '@nestjs/config';
import { ProgramsModule } from './programs/programs.module';
import { ChargesModule } from './charges/charges.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    StudentsModule,
    ProgramsModule,
    ChargesModule,
    PaymentsModule,
  ],
})
export class AppModule {}
