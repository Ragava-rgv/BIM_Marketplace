import { IsIn, Matches } from 'class-validator';

export type OtpPurpose = 'SIGNUP' | 'RESET_PASSWORD';

export class SendOtpDto {
  @Matches(/^[6-9]\d{9}$/, {
    message: 'phone must be a valid 10-digit Indian mobile number',
  })
  phone: string;

  @IsIn(['SIGNUP'])
  purpose: OtpPurpose;
}
