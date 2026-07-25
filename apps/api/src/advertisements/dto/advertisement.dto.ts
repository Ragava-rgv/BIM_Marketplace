import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/** Multipart form fields always arrive as strings (unlike JSON bodies), so booleans need explicit parsing. */
function toBoolean({ value }: { value: unknown }): unknown {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class CreateAdvertisementDto {
  @IsString()
  @Length(1, 150)
  title: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  linkUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdvertisementDto extends PartialType(CreateAdvertisementDto) {}
