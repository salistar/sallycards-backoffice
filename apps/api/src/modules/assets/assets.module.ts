import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import {
  CardAssetSource,
  CardAssetSourceSchema,
} from './schemas/card-asset-source.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CardAssetSource.name, schema: CardAssetSourceSchema },
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule implements OnModuleInit {
  constructor(private readonly assetsService: AssetsService) {}

  async onModuleInit() {
    // Seed default asset sources on startup
    await this.assetsService.seedDefaultSources();
  }
}
