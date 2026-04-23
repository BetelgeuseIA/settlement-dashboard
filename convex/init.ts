import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { characters } from '../data/characters';

export default internalMutation({
  args: { numAgents: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const numAgents = args.numAgents ?? 8;
    const now = Date.now();

    // Create players array with required fields
    const players = [];
    for (let i = 0; i < numAgents; i++) {
      players.push({
        id: `player_${i}`,
        human: undefined,
        lastInput: now,
        position: { x: Math.floor(Math.random() * 50), y: Math.floor(Math.random() * 50) },
        facing: { dx: 1, dy: 0 },
        speed: 0,
      });
    }

    // Create a default world with required structure
    const worldId = await ctx.db.insert('worlds', {
      nextId: numAgents + 1,
      conversations: [],
      players,
      agents: [],
    });

    // Create engine
    const engineId = await ctx.db.insert('engines', {
      currentTime: now,
      lastStepTs: now,
      processedInputNumber: 0,
      running: true,
      generationNumber: 0,
    });

    // Create worldStatus
    await ctx.db.insert('worldStatus', {
      worldId,
      isDefault: true,
      status: 'running',
      lastViewed: now,
      engineId,
    });

    // Create player descriptions using Descriptions array
    const descs = [
      {
        name: 'Lucky',
        character: 'f1',
        identity: 'Lucky is always happy and curious...',
      },
      {
        name: 'Bob',
        character: 'f4',
        identity: 'Bob is always grumpy...',
      },
      {
        name: 'Stella',
        character: 'f6',
        identity: 'Stella can never be trusted...',
      },
      {
        name: 'Alice',
        character: 'f3',
        identity: 'Alice is a famous scientist...',
      },
      {
        name: 'Pete',
        character: 'f7',
        identity: 'Pete is deeply religious...',
      },
    ];
    
    for (let i = 0; i < numAgents; i++) {
      const desc = descs[i % descs.length];
      await ctx.db.insert('playerDescriptions', {
        worldId,
        playerId: `player_${i}`,
        character: desc.character,
        name: desc.name,
        description: desc.identity,
      });
    }

    return { worldId };
  },
});
