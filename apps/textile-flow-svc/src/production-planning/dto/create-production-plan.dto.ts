import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

import { ProductionPriority } from '@textile-flow/shared';

export class CreateProductionPlanDto {
  @IsString()
  lotNo: string;

  @IsString()
  stage: string;

  @IsNumber()
  plannedWeight: number;

  @IsDateString()
  plannedDate: string;

  @IsEnum(ProductionPriority)
  priority: ProductionPriority;

  @IsOptional()
  @IsString()
  remarks?: string;
}
