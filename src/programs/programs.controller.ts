import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

@Controller('programs')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  getAllPrograms(@GetUser() user: User) {
    return this.programsService.getAllPrograms(user);
  }

  @Get('/levels')
  getProgramLevelByProgramId(@Query('programId') programId: string) {
    return this.programsService.getProgramLevelsByProgramId(programId);
  }

  @Get(':id')
  programById(@Param('id') id: string) {
    return this.programsService.getProgramById(id);
  }
}
