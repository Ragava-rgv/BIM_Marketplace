import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ListingCondition, ListingOrigin } from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();

/** A full fresh-entry quote — mirrors the "new listing" form's depth (category/spec-template,
    photos, origin) rather than the old make/model/price-only version. Arrives as
    multipart/form-data (photos travel alongside it), so `specs` needs parsing from JSON text. */
export class SubmitQuoteDto {
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsString()
  @Length(2, 120)
  contactName: string;

  @Matches(/^[6-9]\d{9}$/, {
    message: 'contactPhone must be a valid 10-digit Indian mobile number',
  })
  contactPhone: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  contactCompany?: string;

  @IsOptional()
  @IsUUID()
  catalogCategoryId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  machineCategory?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  machineMake?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  machineModel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(CURRENT_YEAR)
  manufactureYear?: number;

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
  @IsIn(['OLD', 'NEW'])
  condition?: ListingCondition;

  @IsString()
  @Length(2, 120)
  machineLocation: string;

  @Type(() => Number)
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? (JSON.parse(value) as unknown) : value,
  )
  @IsObject()
  specs?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  message?: string;
}
