import init from '../init';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { bootstrapSettlement } from './bootstrap';
import { runSettlementCycle } from './runCycle';

export const ensureDashboardReady = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error(`Invalid world ID: ${args.worldId}`);

    if (world.players.length === 0) {
      await init(ctx, { numAgents: 8 });
    }

    const refreshedWorld = await ctx.db.get(args.worldId);
    if (!refreshedWorld) throw new Error(`World disappeared: ${args.worldId}`);

    let settlement = await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();

    if (!settlement) {
      await bootstrapSettlement(ctx, {
        worldId: args.worldId,
        name: 'Alpha Settlement',
        householdSize: 3,
        initialFood: 18,
        initialWood: 10,
        initialStone: 6,
      });
      settlement = await ctx.db
        .query('settlements')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
        .first();
    }

    const events = await ctx.db
      .query('settlementEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    if (settlement && (settlement.tick === 0 || events.length < 3)) {
      await runSettlementCycle(ctx, { worldId: args.worldId });
      await runSettlementCycle(ctx, { worldId: args.worldId });
    }

    return { ok: true };
  },
});
