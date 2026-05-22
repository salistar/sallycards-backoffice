import { Controller, Get, Param, Patch, Post, Req, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications (DESC sentAt, 50 max)' })
  async list(@Req() req: any) {
    return this.svc.listFor(req.user.userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Compteur des non-lues (badge)' })
  async unread(@Req() req: any) {
    return { count: await this.svc.unreadCount(req.user.userId) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markRead(@Req() req: any, @Param('id') id: string, @Body() body: { read: boolean }) {
    if (body.read) return this.svc.markRead(id, req.user.userId);
    return { ok: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  async readAll(@Req() req: any) {
    return this.svc.markAllRead(req.user.userId);
  }
}
