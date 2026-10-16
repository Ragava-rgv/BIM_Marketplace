import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateBoostPlanDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsString()
  @Length(1, 100)
  displayName: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceInr: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortWeight?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBoostPlanDto extends PartialType(CreateBoostPlanDto) {}
