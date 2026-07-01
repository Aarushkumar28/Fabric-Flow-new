import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateProductionPlanDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  completedWeight?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
