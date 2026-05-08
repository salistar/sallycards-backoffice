import { Body, Controller, Get, Param, Post, Request, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(
    private readonly shop: ShopService,
    private readonly config: ConfigService,
  ) {}

  @Get('packages')
  @ApiOperation({ summary: 'List all active coin packages' })
  async listPackages() {
    return this.shop.listPackages();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('purchase/confirm')
  @ApiOperation({ summary: 'Confirm a purchase from the RevenueCat client SDK' })
  async confirmPurchase(@Request() req: any, @Body() body: any) {
    return this.shop.confirmPurchase(
      body.gameType || 'kdoub',
      req.user.userId,
      body.productId,
      body.purchaseId,
      body.platform ?? 'android',
    );
  }

  @Post('webhook/revenuecat')
  @ApiOperation({ summary: 'RevenueCat server-to-server webhook' })
  async webhook(@Body() body: any, @Headers('authorization') auth?: string) {
    // Optional shared secret check — configured via REVENUECAT_WEBHOOK_SECRET
    const secret = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (secret && auth !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.shop.handleRevenueCatWebhook(body);
  }
}
