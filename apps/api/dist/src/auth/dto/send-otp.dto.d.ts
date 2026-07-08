export type OtpPurpose = 'SIGNUP';
export declare class SendOtpDto {
    phone: string;
    purpose: OtpPurpose;
}
