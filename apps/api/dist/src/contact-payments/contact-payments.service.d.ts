import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import type { CreateContactOrderDto, VerifyContactPaymentDto } from './dto/contact-payment.dto';
export declare class ContactPaymentsService {
    private readonly prisma;
    private readonly razorpay;
    private readonly settings;
    constructor(prisma: PrismaService, razorpay: RazorpayService, settings: AppSettingsService);
    check(buyerId: string, listingId: string): Promise<{
        paid: boolean;
        contact: {
            fullName: string;
            phone: string;
            email: string | null;
        };
    } | {
        paid: boolean;
        contact: null;
    }>;
    createOrder(buyerId: string, dto: CreateContactOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verifyAndReveal(buyerId: string, dto: VerifyContactPaymentDto): Promise<{
        paid: boolean;
        contact: {
            fullName: string;
            phone: string;
            email: string | null;
        };
    }>;
}
