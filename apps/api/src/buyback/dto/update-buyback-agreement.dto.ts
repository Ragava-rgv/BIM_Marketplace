import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BuybackScheduleEntryInputDto {
  @IsInt()
  @Min(0)
  yearOffset: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  retainedValuePct: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  buybackValue: number;
}

export class UpdateBuybackAgreementDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  buybackWindowYears?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  noticePeriodDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  conditions?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuybackScheduleEntryInputDto)
  depreciationSchedule?: BuybackScheduleEntryInputDto[];
}
