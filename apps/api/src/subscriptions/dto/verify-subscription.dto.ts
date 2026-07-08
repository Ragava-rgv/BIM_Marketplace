import { IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionOrderDto {
  @IsUUID()
  planId: string;
}

export class VerifySubscriptionDto {
  @IsUUID()
  planId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
