import { Module } from '@nestjs/common';
import { PurchasesModule } from '../purchases/purchases.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
  imports: [PurchasesModule],
  controllers: [PartnerController],
  providers: [PartnerService],
})
export class PartnerModule {}
