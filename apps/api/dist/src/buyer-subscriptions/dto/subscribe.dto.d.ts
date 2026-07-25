export declare class CreateBuyerSubscriptionOrderDto {
    planId: string;
}
export declare class VerifyBuyerSubscriptionDto {
    planId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
