import type { OtpPurpose } from './send-otp.dto';
export declare class VerifyOtpDto {
    phone: string;
    code: string;
    purpose: OtpPurpose;
}
