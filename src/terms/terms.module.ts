import { Module } from '@nestjs/common';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { TermsRepository } from './terms.repository';

@Module({
  controllers: [TermsController],
  providers: [TermsService, TermsRepository],
})
export class TermsModule {}
