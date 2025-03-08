import { Injectable } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsRepository } from './programs.repository';

@Injectable()
export class ProgramsService {
  constructor(private readonly programsRepository: ProgramsRepository) {}

  createProgram(createProgramDto: CreateProgramDto) {
    return 'This action adds a new program';
  }

  getAllPrograms() {
    return this.programsRepository.getPrograms();
  }

  getProgramLevelsByProgramId(programId: string) {
    return this.programsRepository.getProgramLevelsByProgramId(programId);
  }

  getProgramById(id: string) {
    return `This action returns a #${id} program`;
  }

  updateProgramById(id: number, updateProgramDto: UpdateProgramDto) {
    return `This action updates a #${id} program`;
  }

  removeProgramById(id: number) {
    return `This action removes a #${id} program`;
  }
}
