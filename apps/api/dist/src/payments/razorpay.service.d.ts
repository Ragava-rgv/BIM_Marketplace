import { ConfigService } from '@nestjs/config';
export declare class RazorpayService {
    private readonly config;
    private readonly logger;
    private _razorpay;
    readonly keyId: string;
    private readonly keySecret;
    constructor(config: ConfigService);
    private get razorpay();
    createOrder(amountInr: number, receiptId: string): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    verifySignature(orderId: string, paymentId: string, signature: string): boolean;
}
