import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'player@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Str0ngP@ss!' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    example: 'ronda',
    description: 'Game type to authenticate against',
  })
  @IsString()
  @IsOptional()
  gameType?: string;
}
