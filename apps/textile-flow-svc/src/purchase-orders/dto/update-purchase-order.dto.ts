import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './create-purchase-order.dto';

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  poNumber?: string;

  @IsString()
  @IsOptional()
  hfCode?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  supplierAddress?: string;

  @IsString()
  @IsOptional()
  supplierGST?: string;

  @IsString()
  @IsOptional()
  agent?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  poType?: string;

  @IsString()
  @IsOptional()
  deliveryName?: string;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsString()
  @IsOptional()
  deliveryGST?: string;

  @IsString()
  @IsOptional()
  fabricType?: string;

  @IsString()
  @IsOptional()
  fabricColour?: string;

  @IsString()
  @IsOptional()
  fabricDia?: string;

  @IsString()
  @IsOptional()
  fabricGsm?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  totalFabricWeight?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  @IsOptional()
  items?: PurchaseOrderItemDto[];
}
