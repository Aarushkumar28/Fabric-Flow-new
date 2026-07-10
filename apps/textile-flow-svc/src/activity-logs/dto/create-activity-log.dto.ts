import {
  IsDateString,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityLogDto {
  @IsDateString()
  date: string;

  @IsString()
  user: string;

  @IsString()
  action: string;

  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityLogDto)
  logs: CreateActivityLogDto[];
}
