import { IsNumber } from 'class-validator';

export class UpdateCompactingDto {
  @IsNumber()
  compactWeight: number;
}
