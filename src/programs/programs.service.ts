import { Injectable } from '@nestjs/common';

import { ProgramsRepository } from './programs.repository';

@Injectable()
export class ProgramsService {
  constructor(private readonly programsRepository: ProgramsRepository) {}

  getAllPrograms() {
    return this.programsRepository.getPrograms();
  }

  getProgramLevelsByProgramId(programId: string) {
    return this.programsRepository.getProgramLevelsByProgramId(programId);
  }

  getProgramById(id: string) {
    return `This action returns a #${id} program`;
  }
}
