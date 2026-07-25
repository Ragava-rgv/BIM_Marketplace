import { IsString, IsUUID } from 'class-validator';

export class CreateBuyerSubscriptionOrderDto {
  @IsUUID()
  planId: string;
}

export class VerifyBuyerSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
