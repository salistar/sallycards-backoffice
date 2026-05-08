import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'player@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'CardShark42' })
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username may only contain letters, numbers, underscores, and hyphens',
  })
  username!: string;

  @ApiProperty({ example: 'Str0ngP@ss!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    example: 'player',
    enum: ['player', 'admin', 'moderator'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['player', 'admin', 'moderator'])
  role?: string;

  @ApiProperty({
    example: 'ronda',
    description: 'Game type collection to insert the user into',
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
  gameType!: string;
}
