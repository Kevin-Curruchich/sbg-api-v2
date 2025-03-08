import { ApiProperty } from '@nestjs/swagger';

export class ResponseServiceDto<T> {
  @ApiProperty()
  message: string;

  data: T | T[] | null;

  meta?: ResponseServiceMetaDto | object | null;
}

export class ResponseServiceMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  self: string;

  @ApiProperty()
  nextCursor: null | string;
}
