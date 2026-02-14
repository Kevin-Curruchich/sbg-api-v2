import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { GetTermsDto } from './dto/get-terms.dto';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  create(@Body() createTermDto: CreateTermDto) {
    return this.termsService.createTerm(createTermDto);
  }

  @Get()
  findAll(@Query() getTermsDto: GetTermsDto) {
    return this.termsService.getAllTerms(getTermsDto);
  }

  @Get('list')
  findAllList(@Query() getTermsListDto: GetTermsDto) {
    return this.termsService.getAllTermsList(getTermsListDto);
  }

  @Get('statuses')
  findAllTermStatuses() {
    return this.termsService.getTermsByStatuses();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termsService.getTermById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTermDto: UpdateTermDto) {
    return this.termsService.updateTerm(id, updateTermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.termsService.removeTerm(id);
  }
}
