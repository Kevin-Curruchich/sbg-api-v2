import { Injectable } from '@nestjs/common';

import { TermsRepository } from './terms.repository';

import { formatDate } from 'src/common/helpers/date.helper';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { GetTermsDto, GetTermsListDto } from './dto/get-terms.dto';

@Injectable()
export class TermsService {
  constructor(private readonly termsRepository: TermsRepository) {}

  async createTerm(createTermDto: CreateTermDto) {
    const termData = {
      ...createTermDto,
      start_date: createTermDto.start_date
        ? new Date(createTermDto.start_date)
        : undefined,
      end_date: createTermDto.end_date
        ? new Date(createTermDto.end_date)
        : undefined,
    };
    return await this.termsRepository.createTerm(termData);
  }

  async getAllTerms(getTermsDto: GetTermsDto) {
    const terms = await this.termsRepository.getAllTerms(getTermsDto);

    const termsEnhanced = terms.data.map((term) => ({
      term_id: term.term_id,
      term_name: term.term_name,
      start_date: formatDate(term.start_date, 'YYYY-MM-DD'),
      start_date_formatted: formatDate(term.start_date, 'DD/MM/YYYY'),
      end_date: formatDate(term.end_date, 'YYYY-MM-DD'),
      end_date_formatted: formatDate(term.end_date, 'DD/MM/YYYY'),
      term_status_id: term.term_status_id,
      term_status: term['term_statuses'],
    }));

    return {
      data: termsEnhanced,
      total: terms.total,
    };
  }

  async getAllTermsList(getTermsList: GetTermsListDto) {
    const terms = await this.termsRepository.getTermsList(getTermsList);

    return terms.map((term) => ({
      term_id: term.term_id,
      term_name: term.term_name,
      start_date: formatDate(term.start_date, 'YYYY-MM-DD'),
      end_date: formatDate(term.end_date, 'YYYY-MM-DD'),
      term_status_id: term.term_status_id,
      term_status: term['term_statuses'],
    }));
  }

  async getTermsByStatuses() {
    return await this.termsRepository.getTermsByStatuses();
  }

  async getTermById(term_id: string) {
    return await this.termsRepository.getTermById(term_id);
  }

  async updateTerm(term_id: string, updateTermDto: UpdateTermDto) {
    const termUpdateData = {
      ...updateTermDto,
      start_date: updateTermDto.start_date
        ? new Date(updateTermDto.start_date)
        : undefined,
      end_date: updateTermDto.end_date
        ? new Date(updateTermDto.end_date)
        : undefined,
    };

    return await this.termsRepository.updateTerm(term_id, termUpdateData);
  }

  async removeTerm(term_id: string) {
    const term = await this.getTermById(term_id);

    if (!term) {
      throw new Error(`Term with ID ${term_id} not found`);
    }

    if (term.enrollments.length > 0) {
      throw new Error(
        `Cannot delete term with ID ${term_id} as it has associated enrollments`,
      );
    }

    return await this.termsRepository.removeTerm(term_id);
  }
}
