import { query } from '../_generated/server';
import { v } from 'convex/values';

function severityScore(agent: {
  hunger: number;
  energy: number;
  safety: number;
  morale?: number;
}) {
  return agent.hunger + (100 - agent.energy) + (100 - agent.safety) + (100 - (agent.morale ?? 60));
}

export const getDashboard = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();
    if (!settlement) return null;

    const households = await ctx.db
      .query('households')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const agentNeeds = await ctx.db
      .query('agentNeeds')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const events = await ctx.db
      .query('settlementEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(12);
    const tasks = await ctx.db
      .query('taskQueue')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('status', 'pending'))
      .collect();

    const population = agentNeeds.length;
    const totalFood = households.reduce((sum, h) => sum + h.food, 0);
    const totalWood = households.reduce((sum, h) => sum + h.wood, 0);
    const totalStone = households.reduce((sum, h) => sum + h.stone, 0);
    const avgHunger = population ? agentNeeds.reduce((sum, n) => sum + n.hunger, 0) / population : 0;
    const avgEnergy = population ? agentNeeds.reduce((sum, n) => sum + n.energy, 0) / population : 0;
    const avgSafety = population ? agentNeeds.reduce((sum, n) => sum + n.safety, 0) / population : 0;
    const avgMorale = population ? agentNeeds.reduce((sum, n) => sum + (n.morale ?? 60), 0) / population : 0;

    const criticalAgents = agentNeeds
      .filter((n) => n.hunger >= 75 || n.energy <= 20 || n.safety <= 25 || (n.morale ?? 60) <= 30)
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
        return acc;
      },
      { total: 0, byType: {} as Record<string, number> },
    );

    return {
      settlement,
      alerts: {
        emergencyMode: !!settlement.emergencyMode,
        criticalAgents: criticalAgents.length,
        pendingTasks: taskSummary.total,
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
      taskSummary,
      criticalAgents,
      topStrainedHouseholds,
      topProductiveHouseholds,
      events,
    };
  },
});
