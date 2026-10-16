import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ComplexityTier,
  ListingCondition,
  ListingOrigin,
} from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();

export class CreateListingDto {
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

  @IsString()
  @Length(1, 120)
  machineMake: string;

  @IsString()
  @Length(1, 120)
  machineModel: string;

  /** Optional — null means "not available" (e.g. unknown manufacture year). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(CURRENT_YEAR)
  manufactureYear?: number | null;

  @IsIn(['INDIAN', 'IMPORTED'])
  origin: ListingOrigin;

  /** Required only when origin is IMPORTED; ignored/nulled server-side for INDIAN. */
  @ValidateIf((o) => o.origin === 'IMPORTED')
  @IsNotEmpty()
  @IsString()
  @Length(2, 80)
  importedCountry?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  askingPrice: number;

  @IsString()
  @Length(2, 120)
  locationCity: string;

  @IsString()
  @Length(2, 120)
  locationState: string;

  @IsOptional()
  @IsIn(['SIMPLE', 'STANDARD', 'COMPLEX'])
  complexityTier?: ComplexityTier;

  /** Old / New — required, the seller must always choose. Distinct from conditionGrade (A/B/C quality). */
  @IsIn(['OLD', 'NEW'])
  condition: ListingCondition;

  // Catalog system fields (optional — listings without a catalogCategoryId use legacy string-based category)
  @IsOptional()
  @IsUUID()
  catalogCategoryId?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  conditionGrade?: string;

  /** Optional — null means "not available" (e.g. unknown running hours). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  runningHours?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  serialNumber?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;
}
