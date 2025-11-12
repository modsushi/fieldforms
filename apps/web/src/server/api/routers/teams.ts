import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

export const teamRouter = createTRPCRouter({
  // List all teams in organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const userOrg = (ctx.session.user as any).orgId;

    return ctx.db.team.findMany({
      where: { orgId: userOrg },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get team by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.team.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          workOrders: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }),

  // Create team (supervisor only)
  create: supervisorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.team.create({
        data: {
          name: input.name,
          description: input.description,
          orgId: userOrg,
        },
      });
    }),

  // Update team
  update: supervisorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.team.update({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });
    }),

  // Delete team
  delete: supervisorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.team.delete({
        where: {
          id: input.id,
          orgId: userOrg,
        },
      });
    }),

  // Add member to team
  addMember: supervisorProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      // Verify team belongs to org
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.teamId,
          orgId: userOrg,
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      // Update user's team
      return ctx.db.user.update({
        where: {
          id: input.userId,
          orgId: userOrg,
        },
        data: {
          teamId: input.teamId,
        },
      });
    }),

  // Remove member from team
  removeMember: supervisorProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.user.update({
        where: {
          id: input.userId,
          orgId: userOrg,
        },
        data: {
          teamId: null,
        },
      });
    }),

  // Get available users (not in any team or operators only)
  getAvailableMembers: supervisorProcedure.query(async ({ ctx }) => {
    const userOrg = (ctx.session.user as any).orgId;

    return ctx.db.user.findMany({
      where: {
        orgId: userOrg,
        role: 'OPERATOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        teamId: true,
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }),

  // Get members of a specific team
  getMembers: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const team = await ctx.db.team.findFirst({
        where: {
          id: input.teamId,
          orgId: userOrg,
        },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      return team.members;
    }),

  // Get all users in organization (for step assignment)
  getAllUsers: supervisorProcedure.query(async ({ ctx }) => {
    const userOrg = (ctx.session.user as any).orgId;

    return ctx.db.user.findMany({
      where: {
        orgId: userOrg,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }),
});

