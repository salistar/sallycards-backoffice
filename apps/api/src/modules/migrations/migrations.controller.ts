import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MigrationsService } from './migrations.service';

@ApiTags('Migrations')
@Controller('migrations')
export class MigrationsController {
  constructor(private readonly service: MigrationsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Status des migrations Mongo (appliquées + pending)' })
  async getStatus() {
    return { success: true, data: await this.service.getStatus() };
  }

  @Post('run')
  @ApiOperation({ summary: 'Force l\'exécution des migrations pending (admin)' })
  async run() {
    return { success: true, data: await this.service.runPending() };
  }
}
