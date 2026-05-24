import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './infrastructure/health/health.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { ClientsModule } from './infrastructure/clients/clients.module';
import { StripeModule } from './infrastructure/stripe/stripe.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PartnerModule } from './modules/partner/partner.module';
import { Purchase } from './modules/purchases/entities/purchase.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Purchase],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
    }),
    QueueModule,
    ClientsModule,
    StripeModule,
    PurchasesModule,
    WebhooksModule,
    PartnerModule,
    HealthModule,
  ],
})
export class AppModule {}
