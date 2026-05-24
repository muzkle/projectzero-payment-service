import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { PartnerContextGuard } from '../../common/guards/partner-context.guard';
import { CurrentPartnerId } from '../../common/decorators/current-partner-id.decorator';

@Controller('partner')
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Get('sales')
  @UseGuards(PartnerContextGuard)
  listSales(
    @CurrentPartnerId() partnerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnerService.listSales(
      partnerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('stripe/onboard')
  @UseGuards(PartnerContextGuard)
  stripeOnboard(@CurrentPartnerId() partnerId: string) {
    return this.partnerService.createStripeOnboardLink(partnerId);
  }
}
