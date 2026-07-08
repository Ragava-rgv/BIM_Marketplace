export declare class CreateSubscriptionOrderDto {
    planId: string;
}
export declare class VerifySubscriptionDto {
    planId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
