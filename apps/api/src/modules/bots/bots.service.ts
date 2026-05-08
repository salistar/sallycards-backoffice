import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BotMoveRequest {
  gameType: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  /** Public state: whose turn, table, bot's hand, last moves, scores. */
  state: {
    hand: string[];
    table?: string[];
    history?: { player: string; action: string; card?: string }[];
    rules?: string;
    lockedCards?: string[];
  };
}

export interface BotMoveResponse {
  card: string | null;
  action: 'play' | 'pass' | 'declare';
  declaration?: string;
  reasoning?: string;
  confidence: number;
}

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);
  private readonly geminiKey: string | undefined;
  private readonly geminiModel: string;

  private readonly bots = [
    { id: 'bot-easy',   name: 'Débutant',      difficulty: 'easy',   description: 'Un bot sympa pour les débuts', elo: 800  },
    { id: 'bot-medium', name: 'Intermédiaire', difficulty: 'medium', description: 'Un défi équilibré',            elo: 1200 },
    { id: 'bot-hard',   name: 'Expert',        difficulty: 'hard',   description: 'Un adversaire redoutable',     elo: 1600 },
    { id: 'bot-gemini', name: 'Gemini (IA)',   difficulty: 'expert', description: 'Alimenté par Google Gemini',   elo: 1800 },
  ];

  constructor(private readonly config: ConfigService) {
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY');
    this.geminiModel = this.config.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
    if (!this.geminiKey) {
      this.logger.warn(
        'GEMINI_API_KEY non défini — le bot expert retombera sur une heuristique locale.',
      );
    }
  }

  async findAll() {
    return this.bots;
  }

  async findById(id: string) {
    return this.bots.find((b) => b.id === id) ?? null;
  }

  /**
   * Ask the bot for its next move. If difficulty is `expert` AND a Gemini key
   * is configured, we call Gemini. Otherwise we pick a card with a local
   * heuristic so the game still works offline.
   */
  async computeMove(req: BotMoveRequest): Promise<BotMoveResponse> {
    const t0 = Date.now();
    if ((req.difficulty === 'expert' || req.difficulty === 'hard') && this.geminiKey) {
      try {
        const out = await this.askGemini(req);
        this.logger.log(`Gemini move ${req.gameType}/${req.difficulty} in ${Date.now()-t0}ms → ${out.card}`);
        return out;
      } catch (e: any) {
        this.logger.warn(`Gemini failed (${e?.message ?? e}), fallback to heuristic`);
      }
    }
    return this.heuristicMove(req);
  }

  private heuristicMove(req: BotMoveRequest): BotMoveResponse {
    const hand = req.state.hand || [];
    const locked = new Set(req.state.lockedCards || []);
    const playable = hand.filter((c) => !locked.has(c));
    if (playable.length === 0) {
      return { card: null, action: 'pass', confidence: 0.3, reasoning: 'no playable card' };
    }
    // "medium" picks a middle rank, "easy" picks randomly, "hard" picks the
    // highest if game rewards it, otherwise the lowest.
    const byRank = [...playable].sort((a, b) => this.rankOf(a) - this.rankOf(b));
    let pick: string;
    if (req.difficulty === 'easy') {
      pick = playable[Math.floor(Math.random() * playable.length)];
    } else if (req.difficulty === 'medium') {
      pick = byRank[Math.floor(byRank.length / 2)];
    } else {
      pick = byRank[byRank.length - 1]; // highest
    }
    return {
      card: pick,
      action: 'play',
      confidence: 0.6,
      reasoning: `heuristic:${req.difficulty}`,
    };
  }

  private rankOf(card: string): number {
    const m = card.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  private async askGemini(req: BotMoveRequest): Promise<BotMoveResponse> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`;
    const rules = req.state.rules || `You are an expert ${req.gameType} card-game player. Pick the best card to play from your hand given the table state.`;
    const prompt = [
      rules,
      `Your hand: ${JSON.stringify(req.state.hand)}`,
      req.state.table ? `On the table: ${JSON.stringify(req.state.table)}` : '',
      req.state.lockedCards?.length ? `Locked cards you CANNOT change (already committed): ${JSON.stringify(req.state.lockedCards)}` : '',
      req.state.history?.length ? `Recent moves: ${JSON.stringify(req.state.history.slice(-8))}` : '',
      'Respond ONLY with a compact JSON object: {"card":"<cardId from hand>","action":"play","reasoning":"<short>"}. Pick a card that is in your hand. Never pick a locked card.',
    ].filter(Boolean).join('\n');

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200, responseMimeType: 'application/json' },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini ${res.status}: ${txt.substring(0, 200)}`);
    }
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);

    // Validate the card is in the hand and not locked
    const hand = new Set(req.state.hand || []);
    const locked = new Set(req.state.lockedCards || []);
    const card = parsed.card && hand.has(parsed.card) && !locked.has(parsed.card)
      ? parsed.card
      : req.state.hand?.[0] ?? null;

    return {
      card,
      action: parsed.action === 'pass' ? 'pass' : 'play',
      reasoning: parsed.reasoning ?? 'gemini',
      confidence: 0.9,
    };
  }
}
