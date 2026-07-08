import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import type { CreateContactOrderDto, VerifyContactPaymentDto } from './dto/contact-payment.dto';

@Injectable()
export class ContactPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly settings: AppSettingsService,
  ) {}

  async check(buyerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { fullName: true, phone: true, email: true } } },
    });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    const payment = await this.prisma.contactPayment.findUnique({
      where: { buyerId_listingId: { buyerId, listingId } },
    });

    if (payment?.paidAt) {
      return {
        paid: true,
        contact: {
          fullName: listing.seller.fullName,
          phone: listing.seller.phone,
          email: listing.seller.email,
        },
      };
    }
    return { paid: false, contact: null };
  }

  async createOrder(buyerId: string, dto: CreateContactOrderDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found or not active');
    }
    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('Cannot pay for your own listing');
    }

    // Check if already paid
    const existing = await this.prisma.contactPayment.findUnique({
      where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
    });
    if (existing?.paidAt) {
      throw new BadRequestException('Already paid for this contact');
    }

    const price = await this.settings.getContactRevealPrice();
    const receiptId = `ctc-${buyerId.slice(0, 12)}-${dto.listingId.slice(0, 12)}`;
    const order = await this.razorpay.createOrder(price, receiptId);

    await this.prisma.contactPayment.upsert({
      where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
      create: {
        buyerId,
        listingId: dto.listingId,
        sellerId: listing.sellerId,
        amount: price,
        razorpayOrderId: order.id,
      },
      update: { razorpayOrderId: order.id },
    });

    return {
      razorpayOrderId: order.id,
      amount: price * 100,
      currency: 'INR',
      keyId: this.razorpay.keyId,
    };
  }

  async verifyAndReveal(buyerId: string, dto: VerifyContactPaymentDto) {
    const valid = this.razorpay.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!valid) {
      throw new UnauthorizedException('Payment verification failed');
    }

    const payment = await this.prisma.contactPayment.findUnique({
      where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
    });
    if (!payment) {
      throw new BadRequestException('No pending payment found');
    }
    if (payment.paidAt) {
      throw new BadRequestException('Already paid');
    }

    const updated = await this.prisma.contactPayment.update({
      where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
      data: { razorpayPaymentId: dto.razorpayPaymentId, paidAt: new Date() },
      include: {
        seller: { select: { fullName: true, phone: true, email: true } },
      },
    });

    return {
      paid: true,
      contact: {
        fullName: updated.seller.fullName,
        phone: updated.seller.phone,
        email: updated.seller.email,
      },
    };
  }
}
