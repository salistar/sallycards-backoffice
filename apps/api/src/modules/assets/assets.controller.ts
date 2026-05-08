import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get asset bundle status including source health' })
  async getStatus() {
    return this.assetsService.getStatus();
  }

  @Get('cards')
  @ApiOperation({ summary: 'Get card asset manifest for a deck' })
  @ApiQuery({ name: 'deck', required: false, example: 'french52' })
  async getCards(@Query('deck') deck?: string) {
    return this.assetsService.getCards(deck);
  }

  @Get('cards/:deck/:suit/:value')
  @ApiOperation({ summary: 'Get URLs for a specific card' })
  @ApiParam({ name: 'deck', example: 'french52' })
  @ApiParam({ name: 'suit', example: 'hearts' })
  @ApiParam({ name: 'value', example: '1' })
  @ApiQuery({ name: 'scale', required: false, example: '2' })
  async getCardUrl(
    @Param('deck') deck: string,
    @Param('suit') suit: string,
    @Param('value') value: string,
    @Query('scale') scale?: string,
  ) {
    return this.assetsService.getCardUrl(
      deck,
      suit,
      parseInt(value, 10),
      scale ? parseInt(scale, 10) : 2,
    );
  }

  @Post('download')
  @ApiOperation({ summary: 'Request asset download bundle' })
  async download(@Body() body: { assetIds: string[] }) {
    return this.assetsService.requestDownload(body.assetIds);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List all asset sources with health status' })
  async getSources() {
    return this.assetsService.getSourceStatus();
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify integrity of downloaded assets' })
  @ApiQuery({ name: 'deck', required: false, example: 'french52' })
  async verifyAssets(
    @Query('deck') deck?: string,
    @Body() body?: { hashes?: Record<string, string> },
  ) {
    return this.assetsService.verifyAssets(deck, body?.hashes);
  }
}
