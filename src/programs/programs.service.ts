import { Injectable } from '@nestjs/common';

import { ProgramsRepository } from './programs.repository';
import User from 'src/auth/interfaces/user.interface';
import { ValidRoles } from 'src/auth/interfaces';

@Injectable()
export class ProgramsService {
  constructor(private readonly programsRepository: ProgramsRepository) {}

  getAllPrograms(user: User) {
    // Si es admin, filtrar por programas asignados

    let options = null;

    if (user.role_id === ValidRoles.admin) {
      options = {
        userId: user.user_id,
      };
    }

    // Si es superuser u otro rol, retornar todos los programas
    return this.programsRepository.getPrograms(options);
  }

  getProgramLevelsByProgramId(programId: string) {
    return this.programsRepository.getProgramLevelsByProgramId(programId);
  }

  getProgramById(id: string) {
    return `This action returns a #${id} program`;
  }
}
