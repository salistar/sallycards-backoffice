/**
 * @file hkim.module.ts
 * @description Module NestJS "hkim" MULTI-JEUX. Pas de forFeature :
 * les modèles sont créés dynamiquement par jeu (collection hkim_<jeu>)
 * via la connexion Mongoose globale (@InjectConnection).
 *
 * À enregistrer dans le AppModule :
 *   imports: [ ..., HkimModule ]
 */
import { Module } from '@nestjs/common';
import { HkimController } from './hkim.controller';
import { HkimService } from './hkim.service';

@Module({
  controllers: [HkimController],
  providers: [HkimService],
  exports: [HkimService],
})
export class HkimModule {}
