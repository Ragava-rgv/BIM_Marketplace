import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class UpsertDepreciationEntryDto {
  @IsString()
  @Length(2, 120)
  machineCategory: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearOffset: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  retainedValuePct: number;
}
