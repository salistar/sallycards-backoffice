import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  async broadcast(@Body() dto: { gameType?: string; type?: string; title: string; body: string }) {
    return this.adminService.broadcastNotification(dto);
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
  async createTournament(@Body() dto: any) {
    return this.adminService.createTournament(dto);
  }

  @Post('gifts')
  @ApiOperation({ summary: 'Créer et envoyer un cadeau (bon) avec condition' })
  async createGift(@Body() dto: any) {
    return this.adminService.createGift(dto);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Surveiller l\'activité des utilisateurs (défis)' })
  async activity(@Query('gameType') gameType?: string) {
    return this.adminService.getUserActivity(gameType);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Stats détaillées (jour/semaine/mois + ressources)' })
  async overview() {
    return this.adminService.getOverview();
  }
}
