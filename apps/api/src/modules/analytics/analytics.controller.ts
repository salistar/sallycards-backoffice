import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track un événement (fire-and-forget)' })
  async track(@Body() body: any) {
    if (!body?.event) return { success: false, error: 'event required' };
    await this.service.track({
      event: body.event,
      userId: body.userId,
      variant: body.variant,
      props: body.props,
    });
    return { success: true };
  }

  @Get('events/count')
  @ApiOperation({ summary: 'Compte par event sur N derniers jours' })
  async countByEvent(@Query('days') daysQ?: string) {
    const days = parseInt(daysQ ?? '7', 10);
    return { success: true, data: await this.service.countByEvent(isNaN(days) ? 7 : days) };
  }

  @Get('events/unique-users')
  @ApiOperation({ summary: 'Users uniques par event' })
  async uniqueUsers(@Query('days') daysQ?: string) {
    const days = parseInt(daysQ ?? '7', 10);
    return { success: true, data: await this.service.uniqueUsersByEvent(isNaN(days) ? 7 : days) };
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Funnel A → B (taux de conversion)' })
  async funnel(@Query('a') a?: string, @Query('b') b?: string, @Query('days') daysQ?: string) {
    if (!a || !b) return { success: false, error: 'a et b requis' };
    const days = parseInt(daysQ ?? '30', 10);
    return { success: true, data: await this.service.funnel(a, b, isNaN(days) ? 30 : days) };
  }
}
