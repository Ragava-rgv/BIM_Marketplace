import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private _razorpay: Razorpay | null = null;
  readonly keyId: string;
  private readonly keySecret: string;

  constructor(private readonly config: ConfigService) {
    this.keyId = this.config.get<string>('RAZORPAY_KEY_ID') ?? '';
    this.keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    if (!this.keyId || !this.keySecret) {
      this.logger.warn(
        'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment features disabled',
      );
    }
  }

  private get razorpay(): Razorpay {
    if (!this._razorpay) {
      if (!this.keyId || !this.keySecret) {
        throw new ServiceUnavailableException(
          'Payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        );
      }
      this._razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
    return this._razorpay;
  }

  async createOrder(amountInr: number, receiptId: string) {
    return this.razorpay.orders.create({
      amount: amountInr * 100,
      currency: 'INR',
      receipt: receiptId.slice(0, 40),
    });
  }

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }
}
