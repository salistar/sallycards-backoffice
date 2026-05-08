import { Body, Controller, Get, Param, Post, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BotsService } from './bots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bots')
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  @ApiOperation({ summary: 'List available bots' })
  async findAll() {
    return this.botsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bot by ID' })
  async findById(@Param('id') id: string) {
    const bot = await this.botsService.findById(id);
    if (!bot) throw new NotFoundException('Bot not found');
    return bot;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':gameType/move')
  @ApiOperation({ summary: 'Ask the bot for its next move (local vs-bot mode)' })
  async computeMove(@Param('gameType') gameType: string, @Body() body: any) {
    return this.botsService.computeMove({
      gameType,
      difficulty: body.difficulty ?? 'medium',
      state: body.state ?? {},
    });
  }
}
