export declare class CreateContactOrderDto {
    listingId: string;
}
export declare class VerifyContactPaymentDto {
    listingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
