import { IsUUID } from 'class-validator';
import { PurchaseStatus } from '@projectzero/contracts';

export class CreatePurchaseDto {
  @IsUUID()
  stickerId!: string;
}

export interface PurchaseDto {
  id: string;
  userId: string;
  stickerId: string;
  partnerId: string;
  amountCents: number;
  platformFeeCents: number;
  partnerAmountCents: number;
  paymentIntentId: string;
  status: PurchaseStatus;
  createdAt: string;
}

export interface CreatePurchaseResponseDto {
  id: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  status: PurchaseStatus;
}

export interface PartnerSaleDto {
  id: string;
  userId: string;
  stickerId: string;
  amountCents: number;
  platformFeeCents: number;
  partnerAmountCents: number;
  status: PurchaseStatus;
  createdAt: string;
}

export interface StripeOnboardResponseDto {
  url: string;
  stripeConnectAccountId: string;
}
