import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ErrorCode,
  PartnerStatus,
  PurchaseStatus,
  PurchaseCompletedEvent,
} from '@muzkle/contracts';
import { v4 as uuidv4 } from 'uuid';
import { Purchase } from './entities/purchase.entity';
import { CreatePurchaseDto, CreatePurchaseResponseDto, PurchaseDto } from './dto/purchase.dto';
import { CatalogClient } from '../../infrastructure/clients/catalog.client';
import { IdentityClient } from '../../infrastructure/clients/identity.client';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { QueueService } from '../../infrastructure/queue/queue.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase) private purchasesRepo: Repository<Purchase>,
    private catalogClient: CatalogClient,
    private identityClient: IdentityClient,
    private stripeService: StripeService,
    private queueService: QueueService,
  ) {}

  async create(userId: string, dto: CreatePurchaseDto): Promise<CreatePurchaseResponseDto> {
    const sticker = await this.catalogClient.getSticker(dto.stickerId);
    const partner = await this.identityClient.getPartner(sticker.partnerId);

    if (partner.status !== PartnerStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCode.PARTNER_NOT_ACTIVE,
        message: 'Partner is not active',
      });
    }

    if (sticker.status !== 'published') {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'Sticker is not available for purchase',
      });
    }

    if (sticker.supplyTotal != null && sticker.supplyMinted >= sticker.supplyTotal) {
      throw new BadRequestException({
        code: ErrorCode.STICKER_SOLD_OUT,
        message: 'Sticker sold out',
      });
    }

    const amountCents = sticker.priceCents;
    const platformFeeCents = Math.round(amountCents * (partner.platformFeePercent / 100));
    const partnerAmountCents = amountCents - platformFeeCents;

    if (this.stripeService.isConfigured && !partner.stripeConnectAccountId) {
      throw new BadRequestException({
        code: ErrorCode.PARTNER_NOT_ACTIVE,
        message: 'Partner has not completed Stripe Connect onboarding',
      });
    }

    const purchaseId = uuidv4();
    const { paymentIntentId, clientSecret } = await this.stripeService.createPaymentIntent({
      amountCents,
      currency: sticker.currency,
      platformFeeCents,
      destinationAccountId: partner.stripeConnectAccountId,
      metadata: {
        purchaseId,
        userId,
        stickerId: sticker.id,
        partnerId: partner.id,
      },
    });

    const purchase = await this.purchasesRepo.save(
      this.purchasesRepo.create({
        id: purchaseId,
        userId,
        stickerId: sticker.id,
        partnerId: partner.id,
        amountCents,
        platformFeeCents,
        partnerAmountCents,
        paymentIntentId,
        status: PurchaseStatus.PENDING,
      }),
    );

    return {
      id: purchase.id,
      clientSecret,
      amountCents: purchase.amountCents,
      currency: sticker.currency,
      status: purchase.status,
    };
  }

  async findById(id: string, userId?: string): Promise<PurchaseDto> {
    const purchase = await this.purchasesRepo.findOne({ where: { id } });
    if (!purchase) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Purchase not found' });
    }
    if (userId && purchase.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.UNAUTHORIZED, message: 'Not your purchase' });
    }
    return this.toDto(purchase);
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Purchase | null> {
    return this.purchasesRepo.findOne({ where: { paymentIntentId } });
  }

  async markPaidAndPublish(purchase: Purchase): Promise<Purchase> {
    if (purchase.status === PurchaseStatus.PAID) {
      return purchase;
    }

    purchase.status = PurchaseStatus.PAID;
    const saved = await this.purchasesRepo.save(purchase);

    const event: PurchaseCompletedEvent = {
      eventId: uuidv4(),
      purchaseId: saved.id,
      userId: saved.userId,
      stickerId: saved.stickerId,
      partnerId: saved.partnerId,
      amountCents: saved.amountCents,
      occurredAt: new Date().toISOString(),
    };
    await this.queueService.publishPurchaseCompleted(event);

    return saved;
  }

  async listPartnerSales(
    partnerId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PurchaseDto[]; total: number }> {
    const [items, total] = await this.purchasesRepo.findAndCount({
      where: { partnerId, status: PurchaseStatus.PAID },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: items.map((p) => this.toDto(p)), total };
  }

  toDto(purchase: Purchase): PurchaseDto {
    return {
      id: purchase.id,
      userId: purchase.userId,
      stickerId: purchase.stickerId,
      partnerId: purchase.partnerId,
      amountCents: purchase.amountCents,
      platformFeeCents: purchase.platformFeeCents,
      partnerAmountCents: purchase.partnerAmountCents,
      paymentIntentId: purchase.paymentIntentId,
      status: purchase.status,
      createdAt: purchase.createdAt.toISOString(),
    };
  }
}
