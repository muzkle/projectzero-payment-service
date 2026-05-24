import { Injectable } from '@nestjs/common';
import { PurchasesService } from '../purchases/purchases.service';
import { IdentityClient } from '../../infrastructure/clients/identity.client';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { StripeOnboardResponseDto } from '../purchases/dto/purchase.dto';

@Injectable()
export class PartnerService {
  constructor(
    private purchasesService: PurchasesService,
    private identityClient: IdentityClient,
    private stripeService: StripeService,
  ) {}

  async listSales(partnerId: string, page?: number, limit?: number) {
    const result = await this.purchasesService.listPartnerSales(partnerId, page, limit);
    return {
      data: result.items,
      meta: { total: result.total, page: page ?? 1, limit: limit ?? 20 },
    };
  }

  async createStripeOnboardLink(partnerId: string): Promise<StripeOnboardResponseDto> {
    const partner = await this.identityClient.getPartner(partnerId);

    let accountId = partner.stripeConnectAccountId;
    if (!accountId) {
      accountId = await this.stripeService.createConnectAccount(
        `${partner.slug}@partners.projectzero.local`,
        partner.id,
      );
      await this.identityClient.updateStripeConnectAccount(partner.id, accountId);
    }

    const url = await this.stripeService.createAccountLink(accountId);
    return { url, stripeConnectAccountId: accountId };
  }
}
