import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { FriendStatus } from './schemas/friend.schema';

@ApiTags('Friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly svc: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister mes amis (envoyes + recus + statuts)' })
  async list(@Req() req: any) {
    return this.svc.myFriends(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Envoyer une demande d\'amitie' })
  async add(@Req() req: any, @Body() body: { receiverId: string }) {
    return this.svc.sendRequest(req.user.userId, body.receiverId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Accepter/bloquer une demande recue' })
  async respond(@Req() req: any, @Param('id') id: string, @Body() body: { status: FriendStatus }) {
    return this.svc.respond(id, req.user.userId, body.status);
  }
}
