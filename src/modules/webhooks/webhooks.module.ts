import { Module } from '@nestjs/common';
import { PurchasesModule } from '../purchases/purchases.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [PurchasesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
