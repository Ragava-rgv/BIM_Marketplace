import { IsString, IsUUID } from 'class-validator';

export class CreateContactOrderDto {
  @IsUUID()
  listingId: string;
}

export class VerifyContactPaymentDto {
  @IsUUID()
  listingId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
