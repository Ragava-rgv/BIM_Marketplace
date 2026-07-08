import { IsIn, Length, Matches } from 'class-validator';
import type { OtpPurpose } from './send-otp.dto';

export class VerifyOtpDto {
  @Matches(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian mobile number' })
  phone: string;

  @Length(4, 8)
  code: string;

  @IsIn(['SIGNUP'])
  purpose: OtpPurpose;
}
