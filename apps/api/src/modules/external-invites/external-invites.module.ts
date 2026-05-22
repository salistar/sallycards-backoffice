import { Module } from '@nestjs/common';
import { ExternalInvitesController } from './external-invites.controller';
import { ExternalInvitesService } from './external-invites.service';

@Module({
  controllers: [ExternalInvitesController],
  providers: [ExternalInvitesService],
  exports: [ExternalInvitesService],
})
export class ExternalInvitesModule {}
