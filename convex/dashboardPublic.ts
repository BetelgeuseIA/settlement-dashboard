import { query } from './_generated/server';

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

    const households = await ctx.db
      .query('households')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .collect();
    const agents = await ctx.db
      .query('agentNeeds')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .collect();
    const tasks = await ctx.db
      .query('taskQueue')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId).eq('status', 'pending'))
      .collect();
    const events = await ctx.db
      .query('settlementEvents')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .order('desc')
      .take(10);

    const population = agents.length;
    const totalFood = households.reduce((sum, h) => sum + h.food, 0);
    const totalWood = households.reduce((sum, h) => sum + h.wood, 0);
    const totalStone = households.reduce((sum, h) => sum + h.stone, 0);
    const avgHunger = population ? agents.reduce((sum, a) => sum + a.hunger, 0) / population : 0;
    const avgEnergy = population ? agents.reduce((sum, a) => sum + a.energy, 0) / population : 0;
    const avgSafety = population ? agents.reduce((sum, a) => sum + a.safety, 0) / population : 0;
    const avgMorale = population ? agents.reduce((sum, a) => sum + (a.morale ?? 60), 0) / population : 0;

    const criticalAgents = [...agents]
      .sort((a, b) => {
        const severity = (x: typeof a) => x.hunger + (100 - x.energy) + (100 - x.safety) + (100 - (x.morale ?? 60));
        return severity(b) - severity(a);
      })
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
