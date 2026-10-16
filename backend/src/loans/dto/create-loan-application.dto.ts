import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateLoanApplicationDto {
  @IsUUID()
  listingId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amountRequested: number;
}
