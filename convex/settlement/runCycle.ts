import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { runSettlementTick } from './loop';
import { resolveSettlementTasks } from './resolve';
import { computeSettlementMetrics } from './metrics';
import { runEmergencyPolicy } from './policy';
import { updateSocialSignals } from './social';
import { resolveRoleProductivity } from './productivity';

export const runSettlementCycle = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();
    if (!settlement) throw new Error(`No settlement found for world ${args.worldId}`);

    const startedAt = Date.now();
    const cycleNumber = settlement.tick + 1;
    const cycleId = await ctx.db.insert('settlementCycles', {
      worldId: args.worldId,
      settlementId: settlement._id,
      cycle: cycleNumber,
      tick: cycleNumber,
      status: 'started',
      startedAt,
      summary: `Settlement cycle ${cycleNumber} started`,
    });

    try {
      const tickResult = await runSettlementTick(ctx, { worldId: args.worldId });
      const resolveResult = await resolveSettlementTasks(ctx, { worldId: args.worldId });
      const metrics = await computeSettlementMetrics(ctx, { worldId: args.worldId });
      const emergency = await runEmergencyPolicy(ctx, { worldId: args.worldId });
      const social = await updateSocialSignals(ctx, { worldId: args.worldId });
      const productivity = await resolveRoleProductivity(ctx, { worldId: args.worldId });

      const completedAt = Date.now();
      const pendingTasksAfter = (
        await ctx.db
          .query('taskQueue')
          .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('status', 'pending'))
          .collect()
      ).length;

      await ctx.db.patch(settlement._id, {
        lastCycleAt: completedAt,
        updatedAt: completedAt,
      });
      await ctx.db.patch(cycleId, {
        status: 'completed',
        completedAt,
        durationMs: completedAt - startedAt,
        resolvedTasks: resolveResult.resolved,
        pendingTasksAfter,
        summary: metrics.summary,
      });

      return {
        ok: true,
        tick: tickResult.tick,
        resolved: resolveResult.resolved,
        metrics,
        emergency,
        social,
        productivity,
      };
    } catch (error) {
      const completedAt = Date.now();
      await ctx.db.patch(cycleId, {
        status: 'failed',
        completedAt,
        durationMs: completedAt - startedAt,
        summary: error instanceof Error ? error.message : 'Unknown cycle failure',
      });
      throw error;
    }
  },
});
