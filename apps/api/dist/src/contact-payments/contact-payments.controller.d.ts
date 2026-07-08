import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ContactPaymentsService } from './contact-payments.service';
import { CreateContactOrderDto, VerifyContactPaymentDto } from './dto/contact-payment.dto';
export declare class ContactPaymentsController {
    private readonly service;
    constructor(service: ContactPaymentsService);
    check(user: AuthenticatedUser, listingId: string): Promise<{
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
    createOrder(user: AuthenticatedUser, dto: CreateContactOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(user: AuthenticatedUser, dto: VerifyContactPaymentDto): Promise<{
        paid: boolean;
        contact: {
            fullName: string;
            phone: string;
            email: string | null;
        };
    }>;
}
