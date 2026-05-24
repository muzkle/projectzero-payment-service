import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { UserContextGuard } from '../../common/guards/user-context.guard';

@Controller('purchases')
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Post()
  @UseGuards(UserContextGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(userId, dto);
  }

  @Get(':id')
  @UseGuards(UserContextGuard)
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.purchasesService.findById(id, userId);
  }
}
