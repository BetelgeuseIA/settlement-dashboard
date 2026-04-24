import { query } from './_generated/server';
import { getSettlementAudit } from './settlement/audit';

function severityScore(agent: {
  hunger: number;
  energy: number;
  safety: number;
  morale?: number;
}) {
  return agent.hunger + (100 - agent.energy) + (100 - agent.safety) + (100 - (agent.morale ?? 60));
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!worldStatus) return null;

    const settlement = await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .first();
    if (!settlement) return null;

    const [households, agents, tasks, audit] = await Promise.all([
      ctx.db.query('households').withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId)).collect(),
      ctx.db.query('agentNeeds').withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId)).collect(),
      ctx.db.query('taskQueue').withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId)).collect(),
      getSettlementAudit(ctx, worldStatus.worldId, settlement),
    ]);

    const population = agents.length;
    const totalFood = households.reduce((sum, h) => sum + h.food, 0);
    const totalWood = households.reduce((sum, h) => sum + h.wood, 0);
    const totalStone = households.reduce((sum, h) => sum + h.stone, 0);
    const avgHunger = population ? agents.reduce((sum, a) => sum + a.hunger, 0) / population : 0;
    const avgEnergy = population ? agents.reduce((sum, a) => sum + a.energy, 0) / population : 0;
    const avgSafety = population ? agents.reduce((sum, a) => sum + a.safety, 0) / population : 0;
    const avgMorale = population ? agents.reduce((sum, a) => sum + (a.morale ?? 60), 0) / population : 0;

    const criticalAgents = [...agents]
      .sort((a, b) => severityScore(b) - severityScore(a))
      .slice(0, 5);

    const topStrainedHouseholds = [...households]
      .sort((a, b) => (b.strainScore ?? 0) - (a.strainScore ?? 0))
      .slice(0, 5);

    const topProductiveHouseholds = [...households]
      .sort((a, b) => (b.productivityScore ?? 0) - (a.productivityScore ?? 0))
      .slice(0, 5);

    const taskSummary = tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc.byType[task.type] = (acc.byType[task.type] ?? 0) + 1;
        acc.byStatus[task.status] = (acc.byStatus[task.status] ?? 0) + 1;
        return acc;
      },
      {
        total: 0,
        byType: {} as Record<string, number>,
        byStatus: {
          pending: 0,
          assigned: 0,
          done: 0,
          cancelled: 0,
        } as Record<string, number>,
      },
    );

    return {
      meta: audit?.meta ?? null,
      settlement: {
        id: settlement._id,
        worldId: worldStatus.worldId,
        name: settlement.name,
        status: settlement.status,
        tick: settlement.tick,
        emergencyMode: !!settlement.emergencyMode,
        emergencyReason: settlement.emergencyReason ?? null,
      },
      alerts: {
        emergencyMode: !!settlement.emergencyMode,
        criticalAgents: criticalAgents.length,
        pendingTasks: taskSummary.byStatus.pending ?? 0,
        isStale: audit?.meta.isStale ?? true,
      },
      summary: {
        population,
        totalFood,
        totalWood,
        totalStone,
        avgHunger,
        avgEnergy,
        avgSafety,
        avgMorale,
      },
      counts: {
        households: households.length,
        agents: agents.length,
        events: audit?.recentEvents.length ?? 0,
        tasks: taskSummary,
      },
      audit: {
        recentCycles: audit?.meta.recentCycles ?? [],
        recentEvents: audit?.recentEvents ?? [],
      },
      criticalAgents,
      topStrainedHouseholds,
      topProductiveHouseholds,
    };
  },
});
