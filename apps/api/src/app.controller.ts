import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root - informations generales' })
  getRoot() {
    return {
      name: 'SallyCards API',
      version: '1.0.0',
      description: 'Suite de 10 jeux de cartes MENA',
      documentation: '/api/docs',
      health: '/api/v1/health',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        games: '/api/v1/games',
        rooms: '/api/v1/rooms',
        leaderboard: '/api/v1/leaderboard',
        bots: '/api/v1/bots',
        assets: '/api/v1/assets',
      },
      games: [
        'Ronda', 'Kdoub', 'Belote', 'Poker', 'Tarot',
        'Scopa', 'Okey', 'Concentration', 'Solitaire', 'Qui Est-Ce',
      ],
      languages: ['ar', 'fr', 'darija', 'en', 'es'],
      contact: 'salistarcompany@gmail.com',
    };
  }
}
