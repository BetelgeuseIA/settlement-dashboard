import { mutation } from '../_generated/server';
import init from '../init';

export const ensureDashboardReady = mutation({
  args: {},
  handler: async (ctx) => {
    let worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();

    if (!worldStatus) {
      const result = await init(ctx, { numAgents: 8 });
      worldStatus = await ctx.db
        .query('worldStatus')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .first();
    }

    if (!worldStatus) {
      throw new Error('Could not create default world');
    }

    const world = await ctx.db.get(worldStatus.worldId);
    if (!world) throw new Error('Default world missing');

    if (world.players.length === 0) {
      await init(ctx, { numAgents: 8 });
    }

    let settlement = await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus!.worldId))
      .first();

    if (!settlement) {
      const refreshedWorld = await ctx.db.get(worldStatus.worldId);
      if (!refreshedWorld) throw new Error('World missing after init');
      const now = Date.now();
      const settlementId = await ctx.db.insert('settlements', {
        worldId: worldStatus.worldId,
        name: 'Alpha Settlement',
        status: 'active',
        tick: 2,
        emergencyMode: false,
        emergencyReason: 'stable_bootstrap',
        updatedAt: now,
      });

      const roles = ['forager', 'builder', 'guard', 'laborer'];
      const players = [...refreshedWorld.players];
      const householdSize = 3;
      let householdNumber = 1;
      for (let i = 0; i < players.length; i += householdSize) {
        const slice = players.slice(i, i + householdSize);
        const householdId = await ctx.db.insert('households', {
          worldId: worldStatus.worldId,
          name: `Household ${householdNumber}`,
          memberIds: slice.map((p: any) => p.id),
          food: 12 + householdNumber * 2,
          wood: 7 + householdNumber,
          stone: 4 + (householdNumber % 3),
          productivityScore: 20 + householdNumber * 4,
          strainScore: Math.max(2, 10 - householdNumber),
        });
        await ctx.db.insert('settlementEvents', {
          worldId: worldStatus.worldId,
          tick: 0,
          type: 'household_created',
          summary: `Household ${householdNumber} activated`,
          householdId,
          createdAt: now,
        });
        householdNumber += 1;
      }

      for (const [idx, player] of players.entries()) {
        const hunger = 28 + (idx % 5) * 8;
        const energy = 72 - (idx % 4) * 11;
        const safety = 82 - (idx % 3) * 9;
        const morale = 64 - (idx % 5) * 7;
        const role = roles[idx % roles.length] as 'forager' | 'builder' | 'guard' | 'laborer';
        await ctx.db.insert('agentNeeds', {
          worldId: worldStatus.worldId,
          playerId: player.id,
          hunger,
          energy,
          safety,
          updatedAt: now,
          role,
          morale,
        });
        await ctx.db.insert('taskQueue', {
          worldId: worldStatus.worldId,
          playerId: player.id,
          type: idx % 3 === 0 ? 'gather_food' : idx % 3 === 1 ? 'gather_wood' : 'rest',
          status: 'pending',
          priority: 50 + idx,
          createdAt: now,
          updatedAt: now,
        });
      }

      await ctx.db.insert('settlementEvents', {
        worldId: worldStatus.worldId,
        tick: 1,
        type: 'settlement_bootstrapped',
        summary: `Alpha Settlement ready with ${players.length} agents`,
        createdAt: now,
      });
      await ctx.db.insert('settlementEvents', {
        worldId: worldStatus.worldId,
        tick: 2,
        type: 'settlement_metrics',
        summary: 'Initial operational metrics calculated',
        createdAt: now,
      });

      settlement = await ctx.db.get(settlementId);
    }

    return { ok: true, worldId: worldStatus.worldId, settlementId: settlement?._id };
  },
});
