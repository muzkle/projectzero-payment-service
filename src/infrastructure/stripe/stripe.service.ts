import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePaymentIntentParams {
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  destinationAccountId?: string;
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
}

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;

  constructor(private config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  get isConfigured(): boolean {
    return this.stripe !== null;
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      const mockId = `pi_mock_${uuidv4()}`;
      return {
        paymentIntentId: mockId,
        clientSecret: `${mockId}_secret_mock`,
      };
    }

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: params.amountCents,
      currency: params.currency.toLowerCase(),
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    };

    if (params.destinationAccountId) {
      intentParams.application_fee_amount = params.platformFeeCents;
      intentParams.transfer_data = { destination: params.destinationAccountId };
    }

    const intent = await this.stripe.paymentIntents.create(intentParams);
    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret!,
    };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async createConnectAccount(email: string, partnerId: string): Promise<string> {
    if (!this.stripe) {
      return `acct_mock_${uuidv4()}`;
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      metadata: { partnerId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account.id;
  }

  async createAccountLink(accountId: string): Promise<string> {
    if (!this.stripe) {
      return `https://connect.stripe.com/setup/mock/${accountId}`;
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: this.config.get<string>('STRIPE_CONNECT_REFRESH_URL')!,
      return_url: this.config.get<string>('STRIPE_CONNECT_RETURN_URL')!,
      type: 'account_onboarding',
    });
    return link.url;
  }
}
