import { IsString, IsUUID } from 'class-validator';

export class CreateBoostOrderDto {
  @IsUUID()
  planId: string;
}

export class VerifyBoostDto {
  @IsUUID()
  planId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
