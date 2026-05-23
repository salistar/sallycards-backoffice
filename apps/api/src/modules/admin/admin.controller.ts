import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users with pagination and filters' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a user by ID' })
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID' })
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('stats/activity')
  @ApiOperation({ summary: 'Get user registration activity (last 30 days)' })
  async getActivityStats() {
    return this.adminService.getActivityStats();
  }

  @Get('stats/games-by-type')
  @ApiOperation({ summary: 'Get game counts grouped by type' })
  async getGamesByType() {
    return this.adminService.getGamesByType();
  }

  // ── Notifications, tournois, cadeaux, activité ─────────────────────────────

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Créer et envoyer une notification aux utilisateurs' })
  async broadcast(@Body() dto: { gameType?: string; type?: string; title: string; body: string }, @Req() req: any) {
    const r = await this.adminService.broadcastNotification(dto);
    await this.adminService.audit('notification.broadcast', req.user?.userId, { gameType: dto.gameType, title: dto.title });
    return r;
  }

  @Get('notifications/recent')
  @ApiOperation({ summary: 'Liste des notifications envoyées (groupées)' })
  async recentNotifications() {
    return this.adminService.recentNotifications();
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'Liste de tous les tournois (admin)' })
  async listTournaments() {
    return this.adminService.listTournaments();
  }

  @Post('tournaments')
  @ApiOperation({ summary: 'Créer un tournoi' })
  async createTournament(@Body() dto: any, @Req() req: any) {
    const r = await this.adminService.createTournament(dto);
    await this.adminService.audit('tournament.create', req.user?.userId, { gameType: dto.gameType, type: dto.type });
    return r;
  }

  @Post('gifts')
  @ApiOperation({ summary: 'Créer et envoyer un cadeau (bon) avec condition' })
  async createGift(@Body() dto: any, @Req() req: any) {
    const r = await this.adminService.createGift(dto);
    await this.adminService.audit('gift.create', req.user?.userId, { gameType: dto.gameType, amount: dto.amount });
    return r;
  }

  @Get('activity')
  @ApiOperation({ summary: 'Surveiller l\'activité des utilisateurs (défis)' })
  async activity(@Query('gameType') gameType?: string) {
    return this.adminService.getUserActivity(gameType);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Stats détaillées calculées (fenêtre ?days=7|30|90)' })
  async overview(@Query('days') days?: string) {
    return this.adminService.getOverview(days ? parseInt(days, 10) : 30);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Métriques réelles serveur (CPU/RAM/disque) + base de données' })
  async metrics() {
    return this.adminService.getMetrics();
  }

  // ── Édition / clôture de tournoi ───────────────────────────────────────────
  @Patch('tournaments/:code')
  @ApiOperation({ summary: 'Modifier / clôturer un tournoi' })
  async updateTournament(@Param('code') code: string, @Body() dto: any, @Req() req: any) {
    const r = await this.adminService.updateTournament(code, dto);
    await this.adminService.audit('tournament.update', req.user?.userId, { code, ...dto });
    return r;
  }

  @Delete('tournaments/:code')
  @ApiOperation({ summary: 'Supprimer un tournoi' })
  async deleteTournament(@Param('code') code: string, @Req() req: any) {
    const r = await this.adminService.deleteTournament(code);
    await this.adminService.audit('tournament.delete', req.user?.userId, { code });
    return r;
  }

  // ── Modération du mur ──────────────────────────────────────────────────────
  @Get('wall')
  @ApiOperation({ summary: 'Lister les posts du mur (modération)' })
  async listWall(@Query('gameType') gameType?: string) {
    return this.adminService.listWall(gameType);
  }

  @Delete('wall/:id')
  @ApiOperation({ summary: 'Supprimer un post du mur' })
  async deletePost(@Param('id') id: string, @Req() req: any) {
    const r = await this.adminService.deletePost(id);
    await this.adminService.audit('wall.delete', req.user?.userId, { id });
    return r;
  }

  @Post('ban')
  @ApiOperation({ summary: 'Bannir un utilisateur (ne peut plus poster)' })
  async ban(@Body() dto: { userId: string }, @Req() req: any) {
    const r = await this.adminService.banUser(dto.userId);
    await this.adminService.audit('user.ban', req.user?.userId, { userId: dto.userId });
    return r;
  }

  @Post('unban')
  @ApiOperation({ summary: 'Lever le bannissement' })
  async unban(@Body() dto: { userId: string }, @Req() req: any) {
    const r = await this.adminService.unbanUser(dto.userId);
    await this.adminService.audit('user.unban', req.user?.userId, { userId: dto.userId });
    return r;
  }

  // ── Journal d'audit ────────────────────────────────────────────────────────
  @Get('audit')
  @ApiOperation({ summary: 'Journal des actions admin' })
  async listAudit() {
    return this.adminService.listAudit();
  }
}
