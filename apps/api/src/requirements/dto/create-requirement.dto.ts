import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ComplexityTier, ListingCondition, ListingOrigin } from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();

/** Mirrors CreateListingDto's machine-detail shape so the "Post requirement" form can reuse
    the Sell flow's field components — but origin/condition are optional here (a buyer may
    want "either"), and there's no askingPrice (budget range instead). */
export class CreateRequirementDto {
  @IsString()
  @Length(5, 160)
  title: string;

  @IsString()
  @Length(20, 5000)
  description: string;

  @IsString()
  @Length(2, 120)
  machineCategory: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  machineSubcategory?: string;

  @IsOptional()
  @IsIn(['INDIAN', 'IMPORTED'])
  origin?: ListingOrigin;

  /** Required only when origin is IMPORTED; ignored/nulled server-side otherwise. */
  @ValidateIf((o) => o.origin === 'IMPORTED')
  @IsNotEmpty()
  @IsString()
  @Length(2, 80)
  importedCountry?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(CURRENT_YEAR)
  manufactureYear?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  runningHours?: number | null;

  @IsOptional()
  @IsIn(['OLD', 'NEW'])
  condition?: ListingCondition;

  @IsOptional()
  @IsIn(['SIMPLE', 'STANDARD', 'COMPLEX'])
  complexityTier?: ComplexityTier;

  @IsOptional()
  @IsUUID()
  catalogCategoryId?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  locationCity?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  locationState?: string;
}
