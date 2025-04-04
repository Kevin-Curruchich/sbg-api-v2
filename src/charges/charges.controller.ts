import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';
import { StudentChargesQueryDto } from './dto/student-charges-query.dto';
import { GetChargesCreated } from './dto/get-charges-created.dto';
import { UpdateStudentChargeDto } from './dto/update-student-charge.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import User from 'src/auth/interfaces/user.interface';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('charges')
@Auth(ValidRoles.admin, ValidRoles.superuser)
@ApiBearerAuth()
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  @Post()
  create(@Body() createChargeDto: CreateChargeDto) {
    return this.chargesService.create(createChargeDto);
  }

  @Post('student')
  createChargeForStudent(@Body() createChargeDto: CreateForStudentChargeDto) {
    return this.chargesService.createChargeForStudent(createChargeDto);
  }

  @Get('apply/student/:studentId')
  getChargesApplyToStudent(@Param('studentId') studentId: string) {
    return this.chargesService.getChargesApplyToStudent(studentId);
  }

  @Get('student/:studentId/balance')
  @Public() // Remove role restrictions to make it public
  getStudentBalance(@Param('studentId') studentId: string) {
    return this.chargesService.getStudentBalance(studentId);
  }

  @Get('student/:studentId')
  getChargesByStudentId(
    @Param('studentId') studentId: string,
    @Query() chargesQuery: StudentChargesQueryDto,
  ) {
    return this.chargesService.getChargesByStudentId(studentId, chargesQuery);
  }

  @Get()
  findAll(@Query() query: GetChargesCreated, @GetUser() user: User) {
    return this.chargesService.getAllCharges(query, user);
  }

  @Get('program')
  getChargeTypesByProgramId(@Query('programId') programId: string) {
    return this.chargesService.getChargeTypesByProgramId(programId);
  }

  @Get('statuses')
  getChargeStatuses() {
    return this.chargesService.getChargeStatuses();
  }

  @Put('/:id/student')
  update(
    @Param('id') chargeId: string,
    @Body() updateChargeDto: UpdateStudentChargeDto,
  ) {
    return this.chargesService.updateChargeStudent(chargeId, updateChargeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargesService.remove(+id);
  }
}
