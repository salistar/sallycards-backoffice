import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GDPRService } from './gdpr.service';
import { UserSchema } from './schemas/user.schema';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RondaUser', schema: UserSchema, collection: 'ronda_users' },
      { name: 'KdoubUser', schema: UserSchema, collection: 'kdoub_users' },
      { name: 'BeloteUser', schema: UserSchema, collection: 'belote_users' },
      { name: 'PokerUser', schema: UserSchema, collection: 'poker_users' },
      { name: 'TarotUser', schema: UserSchema, collection: 'tarot_users' },
      { name: 'ScopaUser', schema: UserSchema, collection: 'scopa_users' },
      { name: 'OkeyUser', schema: UserSchema, collection: 'okey_users' },
      {
        name: 'ConcentrationUser',
        schema: UserSchema,
        collection: 'concentration_users',
      },
      {
        name: 'SolitaireUser',
        schema: UserSchema,
        collection: 'solitaire_users',
      },
      {
        name: 'QuiestceUser',
        schema: UserSchema,
        collection: 'quiestce_users',
      },
      { name: Achievement.name, schema: AchievementSchema },
    ]),
  ],
  controllers: [UsersController],
  // GDPRService est déclaré ici pour être injecté dans UsersController.
  // Il n'est pas exporté car réservé au flux CNDP (loi 09-08) du user lui-même.
  providers: [UsersService, GDPRService],
  exports: [UsersService],
})
export class UsersModule {}
