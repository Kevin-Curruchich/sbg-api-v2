import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

import { TermStatus } from './constants/term-status.constant';
import { GetTermsDto, GetTermsListDto } from './dto/get-terms.dto';
import { PrismaCRUD } from 'src/prisma/prisma-crud.service';

@Injectable()
export class TermsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createTerm(createTermDto: CreateTermDto) {
    return await this.prismaService.terms.create({
      data: { ...createTermDto, term_status_id: TermStatus.ACTIVE },
    });
  }

  async getAllTerms(getTermsDto: GetTermsDto) {
    return await PrismaCRUD.getDataWithOffsetPagination<
      typeof this.prismaService.terms
    >(
      this.prismaService.terms,
      {
        where: {
          term_name: {
            contains: getTermsDto?.search,
            mode: 'insensitive',
          },
          term_status_id: getTermsDto?.term_status_id || TermStatus.ACTIVE,
          start_date: getTermsDto?.start_date
            ? { gte: getTermsDto.start_date }
            : undefined,
          end_date: getTermsDto?.end_date
            ? { lte: getTermsDto.end_date }
            : undefined,
        },
        include: {
          term_statuses: true,
        },
        orderBy: {
          start_date: 'desc',
        },
      },
      {
        page: getTermsDto?.page || 1,
        take: getTermsDto?.take || 10,
      },
    );
  }

  async getTermsList(getTermsDto: GetTermsListDto) {
    return await this.prismaService.terms.findMany({
      where: {
        term_name: {
          contains: getTermsDto?.search,
          mode: 'insensitive',
        },
        term_status_id: getTermsDto?.term_status_id || TermStatus.ACTIVE,
      },
      orderBy: {
        start_date: 'desc',
      },
    });
  }

  async getTermsByStatuses() {
    return await this.prismaService.term_statuses.findMany();
  }

  async getTermById(term_id: string) {
    return await this.prismaService.terms.findUnique({
      where: { term_id: term_id },
      include: { term_statuses: true, enrollments: true },
    });
  }

  async updateTerm(term_id: string, updateTermDto: UpdateTermDto) {
    return await this.prismaService.terms.update({
      where: { term_id: term_id },
      data: updateTermDto,
    });
  }

  async removeTerm(term_id: string) {
    return await this.prismaService.terms.delete({
      where: { term_id: term_id },
    });
  }

  async;
}
