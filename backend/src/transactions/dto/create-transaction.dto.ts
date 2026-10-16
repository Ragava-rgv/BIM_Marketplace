import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  listingId: string;

  @IsUUID()
  buyerId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  salePrice: number;
}
