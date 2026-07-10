import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  count: string;

  @IsString()
  @IsNotEmpty()
  quality: string;

  @IsInt()
  @Min(0)
  bags: number;

  @IsNumber()
  @Min(0)
  bagWeight: number;

  @IsNumber()
  @Min(0)
  totalWeight: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsNumber()
  @Min(0)
  cgst: number;

  @IsNumber()
  @Min(0)
  sgst: number;
}

export class CreatePurchaseOrderDto {
  // poNumber is now auto-generated server-side — not required from client
  @IsString()
  @IsOptional()
  poNumber?: string;

  @IsString()
  @IsOptional()
  hfCode?: string;

  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsNotEmpty()
  supplierAddress: string;

  @IsString()
  @IsNotEmpty()
  supplierGST: string;

  @IsString()
  @IsOptional()
  agent?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  deliveryDate: string;

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

  /**
   * Direct Mill ID — preferred over name-based lookup.
   * Sent by the PO form when a Mill is selected from the dropdown.
   */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  millId?: number;

  /**
   * Direct Knitter ID — preferred over name-based lookup.
   * Sent by the PO form when a Knitter is selected as deliveryName.
   */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  knitterId?: number;

  /**
   * FB No. — only used when poType = 'GREY_FABRIC'.
   * Distinct from HF Code which is used for YARN POs.
   */
  @IsString()
  @IsOptional()
  fbNo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
