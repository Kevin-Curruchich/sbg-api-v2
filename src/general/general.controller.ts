import { Controller, Get } from '@nestjs/common';
import { GeneralService } from './general.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ValidRoles } from 'src/auth/interfaces';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';

@Controller('general')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('dashboard')
  getDashboard(@GetUser() user: User) {
    return this.generalService.getDashboard(user);
  }
}
