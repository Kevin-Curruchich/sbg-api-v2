import { Prisma } from '@prisma/client';
import {
  CursorPaginationFilterDto,
  PaginationFilterDto,
} from './dto/pagination-filter.dto';
import { PaginationPrisma } from './interfaces/pagination-prisma.interface';

export class PrismaCRUD {
  static async getDataWithOffsetPagination<T>(
    prismaModel: T,
    args: Omit<Prisma.Args<T, 'findMany'>, 'cursor' | 'skip' | 'take'>,
    paginationFilter: PaginationFilterDto,
  ): Promise<
    PaginationPrisma<Prisma.Result<T, Prisma.Args<T, 'findMany'>, 'findMany'>>
  > {
    const { distinct, include, orderBy, select, where } = args;
    const { page, take } = paginationFilter;
    try {
      const data = await prismaModel['findMany']({
        distinct,
        include,
        orderBy,
        select,
        where,
        skip: take * (page - 1),
        take,
      });
      const total = await prismaModel['count']({
        where,
      });
      return {
        data,
        total,
      } as any;
    } catch (error) {
      throw error;
    }
  }

  static async getDataWithCursorPagination<T>(
    prismaModel: T,
    args: Omit<Prisma.Args<T, 'findMany'>, 'cursor' | 'skip' | 'take'>,
    paginationFilter: CursorPaginationFilterDto & { start?: string | number },
    cursorField: keyof Prisma.Args<T, 'findMany'>['where'],
  ): Promise<
    PaginationPrisma<Prisma.Result<T, Prisma.Args<T, 'findMany'>, 'findMany'>>
  > {
    const { distinct, include, orderBy, select, where } = args;
    const { start, limit, cursor } = paginationFilter;

    const cursorValidation = cursor
      ? {
          skip: 1,
          cursor: {
            [cursorField]: cursor,
          },
        }
      : {
          skip: start,
        };

    try {
      const data = await prismaModel['findMany']({
        distinct,
        include,
        orderBy,
        select,
        where,
        take: limit,
        ...cursorValidation,
      });

      const total = await prismaModel['count']({ where });

      return {
        data,
        total,
      } as any;
    } catch (error) {
      throw error;
    }
  }
}
