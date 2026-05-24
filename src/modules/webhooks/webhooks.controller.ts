import { Controller, Post, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('stripe')
  stripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body is required for Stripe webhooks');
    }
    return this.webhooksService.handleStripeWebhook(rawBody, signature);
  }
}
