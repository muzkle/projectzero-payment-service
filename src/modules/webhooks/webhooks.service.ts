import { Injectable, BadRequestException } from '@nestjs/common';
import { PurchasesService } from '../purchases/purchases.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  constructor(
    private purchasesService: PurchasesService,
    private stripeService: StripeService,
  ) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
    const purchase = await this.purchasesService.findByPaymentIntentId(intent.id);
    if (!purchase) {
      return;
    }
    await this.purchasesService.markPaidAndPublish(purchase);
  }
}
