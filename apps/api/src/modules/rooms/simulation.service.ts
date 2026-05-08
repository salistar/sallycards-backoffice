import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { BotsService } from '../bots/bots.service';

interface SimulatedMoveRequest {
  roomCode: string;
  gameType: string;
  simulatedUserId: string;
  state: {
    hand: string[];
    table?: string[];
    lockedValue?: string | null;  // valeur verrouillée de la séquence
    history?: any[];
  };
}

/**
 * Drives "simulated" players in a room. When a room is marked as simulated
 * (config.isSimulated = true) every non-host seat is flagged isSimulated.
 * On each server-driven turn, the socket-server calls this service to get
 * the bot's move (via BotsService which itself may call Gemini).
 *
 * The service ALSO respects the Kdoub rule "locked value": if a declared
 * value is in play, the bot is forced to declare that same value (even if
 * it means bluffing).
 */
@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectConnection() private readonly conn: Connection,
    private readonly bots: BotsService,
  ) {}

  async computeSimulatedMove(req: SimulatedMoveRequest) {
    this.logger.log(
      `Simulated move: room=${req.roomCode} user=${req.simulatedUserId} lockedValue=${req.state.lockedValue}`,
    );

    // Mix difficulties across the simulated table so it feels like real
    // players — seed the difficulty off the userId hash.
    let hash = 0;
    for (let i = 0; i < req.simulatedUserId.length; i++)
      hash = (hash * 31 + req.simulatedUserId.charCodeAt(i)) | 0;
    const difficulties: Array<'easy' | 'medium' | 'hard' | 'expert'> = [
      'easy', 'medium', 'hard', 'expert',
    ];
    const difficulty = difficulties[Math.abs(hash) % 4];

    const move = await this.bots.computeMove({
      gameType: req.gameType,
      difficulty,
      state: {
        hand: req.state.hand,
        table: req.state.table,
        history: req.state.history,
        rules: `You are playing ${req.gameType}. The locked declared value (if any) MUST be used; never declare a different value. A card you play face-down can be a bluff (hand value ≠ declared value) as long as declared value matches the locked value.`,
        // Kdoub rule: if a value is locked for the sequence, the bot has no
        // choice — its own declaredValue MUST be `lockedValue`. We pass it
        // as a constraint in `rules`; the service also enforces it below.
        lockedCards: [],
      },
    });

    return {
      ...move,
      difficulty,
      declaredValue: req.state.lockedValue ?? move.card, // locked value wins
    };
  }
}
