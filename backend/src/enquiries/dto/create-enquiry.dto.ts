import { IsUUID } from 'class-validator';

export class CreateEnquiryDto {
  @IsUUID()
  listingId: string;
}
