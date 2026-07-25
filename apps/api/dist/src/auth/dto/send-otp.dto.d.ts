export type OtpPurpose = 'SIGNUP' | 'RESET_PASSWORD';
export declare class SendOtpDto {
    phone: string;
    purpose: OtpPurpose;
}
