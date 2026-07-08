import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubcategoryDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 120)
  slug: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  iconKey?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
