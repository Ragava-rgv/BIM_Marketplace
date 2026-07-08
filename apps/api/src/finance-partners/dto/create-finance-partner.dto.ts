import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { FinancePartnerType } from '@prisma/client';

export class CreateFinancePartnerDto {
  @IsString()
  @Length(2, 160)
  name: string;

  @IsIn(['BANK', 'NBFC'])
  type: FinancePartnerType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  referralRate: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
