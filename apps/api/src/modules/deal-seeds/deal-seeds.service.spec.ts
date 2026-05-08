/**
 * Tests d'intégration pour DealSeedsService :
 *  - Connexion MongoDB en mémoire (mongodb-memory-server)
 *  - Vérifie le upsert intelligent : insert nouveau / duplicate / updated
 */

import { Test } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { DealSeed, DealSeedSchema } from './schemas/deal-seed.schema';
import { SeedHistoryEntry, SeedHistorySchema } from './schemas/seed-history.schema';
import { SpiderDealV2, SpiderDealV2Schema } from './schemas/spider-deal-v2.schema';
import { DealSeedsService } from './deal-seeds.service';

describe('DealSeedsService (integration)', () => {
  let service: DealSeedsService;
  let mongo: MongoMemoryServer;
  let model: Model<DealSeed>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: DealSeed.name, schema: DealSeedSchema },
          { name: SeedHistoryEntry.name, schema: SeedHistorySchema },
          { name: SpiderDealV2.name, schema: SpiderDealV2Schema },
        ]),
      ],
      providers: [DealSeedsService],
    }).compile();

    // Override onModuleInit pour ne pas lancer le seeding background pendant le test
    service = moduleRef.get(DealSeedsService);
    (service as any).onModuleInit = async () => { /* skip */ };

    model = moduleRef.get<Model<DealSeed>>(getModelToken(DealSeed.name));
  }, 30000);

  afterAll(async () => {
    // Cleanup le timer d'historique éventuel pour éviter "open handles"
    if ((service as any).historyTimer) {
      clearInterval((service as any).historyTimer);
      (service as any).historyTimer = null;
    }
    if (mongo) await mongo.stop();
  });

  beforeEach(async () => {
    await model.deleteMany({}).exec();
  });

  describe('submitSeed', () => {
    const baseSeed = {
      variant: 'klondike-1',
      initialState: { phase: 'playing', moves: 0 },
      solution: [],
      difficulty: 'medium',
      dealHash: 'test-hash-001',
      metadata: {},
    };

    it('insère un nouveau seed', async () => {
      const result = await service.submitSeed(baseSeed);
      expect('duplicate' in result).toBe(false);
      expect('updated' in result).toBe(false);
      const count = await model.countDocuments({ variant: 'klondike-1' });
      expect(count).toBe(1);
    });

    it('détecte le duplicate (même hash, même solution vide)', async () => {
      await service.submitSeed(baseSeed);
      const result = await service.submitSeed(baseSeed);
      expect('duplicate' in result && result.duplicate).toBe(true);
      const count = await model.countDocuments({ variant: 'klondike-1' });
      expect(count).toBe(1);
    });

    it('upsert : met à jour la solution si la précédente était vide', async () => {
      await service.submitSeed(baseSeed); // solution=[]
      const newSolution = [{ type: 'DRAW' }, { type: 'DRAW' }];
      const result = await service.submitSeed({
        ...baseSeed,
        solution: newSolution,
      });
      expect('updated' in result && result.updated).toBe(true);
      const doc = await model.findOne({ variant: 'klondike-1', dealHash: 'test-hash-001' });
      expect(doc?.solution).toHaveLength(2);
    });

    it('upsert : conserve la solution existante si la nouvelle est plus longue', async () => {
      const shortSolution = [{ type: 'DRAW' }];
      await service.submitSeed({ ...baseSeed, solution: shortSolution });
      const longSolution = [{ type: 'DRAW' }, { type: 'DRAW' }, { type: 'DRAW' }];
      const result = await service.submitSeed({ ...baseSeed, solution: longSolution });
      expect('duplicate' in result && result.duplicate).toBe(true);
      const doc = await model.findOne({ variant: 'klondike-1', dealHash: 'test-hash-001' });
      expect(doc?.solution).toHaveLength(1); // pas remplacée
    });

    it('upsert : remplace si la nouvelle solution est plus courte', async () => {
      const longSolution = [{ type: 'DRAW' }, { type: 'DRAW' }, { type: 'DRAW' }];
      await service.submitSeed({ ...baseSeed, solution: longSolution });
      const shortSolution = [{ type: 'DRAW' }];
      const result = await service.submitSeed({ ...baseSeed, solution: shortSolution });
      expect('updated' in result && result.updated).toBe(true);
      const doc = await model.findOne({ variant: 'klondike-1', dealHash: 'test-hash-001' });
      expect(doc?.solution).toHaveLength(1);
    });

    it('crée un seed différent pour un dealHash différent', async () => {
      await service.submitSeed(baseSeed);
      await service.submitSeed({ ...baseSeed, dealHash: 'test-hash-002' });
      const count = await model.countDocuments({ variant: 'klondike-1' });
      expect(count).toBe(2);
    });
  });

  describe('getStats', () => {
    it('compte total + couverture solution', async () => {
      await service.submitSeed({
        variant: 'klondike-1', dealHash: 'h1', initialState: {}, solution: [{ a: 1 }], difficulty: 'medium',
      });
      await service.submitSeed({
        variant: 'klondike-1', dealHash: 'h2', initialState: {}, solution: [], difficulty: 'medium',
      });
      await service.submitSeed({
        variant: 'spider-1', dealHash: 'h3', initialState: {}, solution: [{ a: 1 }], difficulty: 'medium',
      });

      const stats = await service.getStats();
      expect(stats.grandTotal).toBe(3);
      expect(stats.grandWithSolution).toBe(2);
      expect(stats.total['klondike-1']).toBe(2);
      expect(stats.withSolution['klondike-1']).toBe(1);
      expect(stats.coverage['klondike-1']).toBe(50);
      expect(stats.coverage['spider-1']).toBe(100);
    });
  });

  describe('getRandomSeed', () => {
    it('retourne null si aucun seed', async () => {
      const seed = await service.getRandomSeed('klondike-1');
      expect(seed).toBeNull();
    });

    it('retourne un seed existant', async () => {
      await service.submitSeed({
        variant: 'klondike-1', dealHash: 'h1',
        initialState: { phase: 'playing' }, solution: [], difficulty: 'medium',
      });
      const seed = await service.getRandomSeed('klondike-1');
      expect(seed).toBeTruthy();
      expect(seed?.variant).toBe('klondike-1');
    });
  });
});
