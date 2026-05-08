import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'online',
    enum: ['online', 'offline', 'in_game', 'idle'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['online', 'offline', 'in_game', 'idle'])
  status?: string;

  @ApiPropertyOptional({
    example: 'ronda',
    description:
      'Filter by game type collection. If omitted, queries all collections.',
    enum: [
      'ronda',
      'kdoub',
      'belote',
      'poker',
      'tarot',
      'scopa',
      'okey',
      'concentration',
      'solitaire',
      'quiestce',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'ronda',
    'kdoub',
    'belote',
    'poker',
    'tarot',
    'scopa',
    'okey',
    'concentration',
    'solitaire',
    'quiestce',
  ])
  gameType?: string;
}
