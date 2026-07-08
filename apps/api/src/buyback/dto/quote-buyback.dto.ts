import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateIf } from 'class-validator';

export class QuoteBuybackDto {
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ValidateIf((dto: QuoteBuybackDto) => !dto.listingId)
  @IsString()
  @Length(2, 160)
  machineReference?: string;

  @IsString()
  @Length(2, 120)
  machineCategory: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  machineAgeYears: number;
}
