import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, ListingStatus, Prisma, Transaction, UserRole } from '@prisma/client';
import { BUYER_COMMISSION_RATE, SELLER_COMMISSION_RATE } from '@machinebazaar/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a transaction once buyer and seller have agreed an offer.
   * Commission split is fixed at 1% buyer + 1% seller = 2% total (§8.6) — non-negotiable.
   */
  async create(sellerId: string, dto: { listingId: string; buyerId: string; salePrice: number }): Promise<Transaction> {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.status === ListingStatus.SOLD) {
      throw new ForbiddenException('This listing has already been sold');
    }

    const enquiry = await this.prisma.enquiry.findUnique({
      where: { listingId_buyerId: { listingId: dto.listingId, buyerId: dto.buyerId } },
    });
    if (!enquiry) {
      throw new ForbiddenException('This buyer must enquire about the listing before a transaction can be created');
    }

    const salePrice = new Prisma.Decimal(dto.salePrice);
    const buyerCommission = salePrice.mul(BUYER_COMMISSION_RATE);
    const sellerCommission = salePrice.mul(SELLER_COMMISSION_RATE);

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          listingId: dto.listingId,
          buyerId: dto.buyerId,
          sellerId,
          salePrice,
          buyerCommission,
          sellerCommission,
          commissionStatus: CommissionStatus.PENDING,
        },
      }),
      this.prisma.listing.update({
        where: { id: dto.listingId },
        data: { status: ListingStatus.UNDER_OFFER },
      }),
    ]);

    return transaction;
  }

  async listForUser(userId: string, role: UserRole): Promise<Transaction[]> {
    if (role === UserRole.ADMIN) {
      return this.prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
    }
    const where = role === UserRole.SELLER ? { sellerId: userId } : { buyerId: userId };
    return this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  /**
   * Admin marks the 2% commission as PAID. This is the ONLY trigger that may
   * release buyer<->seller contact details (§6.4 / §6.7 / §8.5) — no earlier path exists.
   */
  async markCommissionPaid(transactionId: string): Promise<Transaction> {
    const transaction = await this.findById(transactionId);
    if (transaction.commissionStatus === CommissionStatus.PAID) {
      return transaction;
    }

    const contactReleasedAt = new Date();

    const [updated] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: { commissionStatus: CommissionStatus.PAID, contactReleasedAt },
      }),
      this.prisma.listing.update({
        where: { id: transaction.listingId },
        data: { status: ListingStatus.SOLD },
      }),
    ]);

    return updated;
  }

  /**
   * Returns the counterpart's contact details once the commission has been
   * marked PAID for this transaction (§6.4 / §6.7 / §8.5).
   */
  async getContact(transactionId: string, userId: string) {
    const transaction = await this.findById(transactionId);
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException('You are not a party to this transaction');
    }

    if (!transaction.contactReleasedAt) {
      return { released: false as const };
    }

    const counterpartId = transaction.buyerId === userId ? transaction.sellerId : transaction.buyerId;
    const counterpart = await this.prisma.user.findUnique({
      where: { id: counterpartId },
      select: { fullName: true, phone: true, email: true },
    });
    if (!counterpart) {
      throw new NotFoundException('Counterpart not found');
    }

    return { released: true as const, contact: counterpart };
  }

  /** All transactions for this user where contact details have been released. */
  async listReleasedContacts(userId: string, role: UserRole) {
    const where =
      role === UserRole.SELLER
        ? { sellerId: userId, contactReleasedAt: { not: null } }
        : { buyerId: userId, contactReleasedAt: { not: null } };

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { contactReleasedAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { fullName: true, phone: true, email: true } },
        seller: { select: { fullName: true, phone: true, email: true } },
      },
    });

    return transactions.map((transaction) => ({
      transactionId: transaction.id,
      listingId: transaction.listingId,
      listingTitle: transaction.listing.title,
      contactReleasedAt: transaction.contactReleasedAt,
      contact: role === UserRole.SELLER ? transaction.buyer : transaction.seller,
    }));
  }
}
