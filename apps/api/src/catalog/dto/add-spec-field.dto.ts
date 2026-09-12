import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SpecFieldTypeDto {
  number = 'number',
  text = 'text',
  select = 'select',
  boolean = 'boolean',
}

export enum SpecFilterTypeDto {
  range = 'range',
  exact = 'exact',
  none = 'none',
}

export class AddSpecFieldDto {
  /** Omit for a "common" field shown for every subcategory under this category;
      set to scope the field to one specific subcategory only. */
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsString()
  @Length(1, 80)
  fieldKey: string;

  @IsString()
  @Length(1, 120)
  fieldLabel: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  unit?: string;

  @IsEnum(SpecFieldTypeDto)
  fieldType: SpecFieldTypeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsEnum(SpecFilterTypeDto)
  filterType?: SpecFilterTypeDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  helpText?: string;
}
