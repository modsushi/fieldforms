import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

export const workflowsRouter = createTRPCRouter({
  // List all workflows for the organization
  list: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.workflow.findMany({
        where: {
          orgId: userOrg,
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
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

  // Get workflow by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.workflow.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          workOrders: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }),

  // Create workflow (supervisor only)
  create: supervisorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        definition: z.any(), // Workflow definition with steps
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;
      const userId = ctx.session.user.id;

      return ctx.db.workflow.create({
        data: {
          orgId: userOrg,
          name: input.name,
          description: input.description,
          definition: input.definition,
          triggerConfig: {}, // Empty trigger config for now
          steps: input.definition.steps || [], // Legacy field
          isActive: input.isActive,
          createdBy: userId,
        },
      });
    }),

  // Update workflow
  update: supervisorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        definition: z.any().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;
      const { id, ...data } = input;

      // Verify ownership
      const workflow = await ctx.db.workflow.findFirst({
        where: {
          id,
          orgId: userOrg,
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      // If definition is updated, also update steps array
      const updateData: any = { ...data };
      if (data.definition) {
        updateData.steps = data.definition.steps || [];
      }

      return ctx.db.workflow.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete workflow (soft delete by marking inactive)
  delete: supervisorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      // Verify ownership
      const workflow = await ctx.db.workflow.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        include: {
          _count: {
            select: {
              workOrders: {
                where: {
                  status: {
                    in: ['PENDING', 'IN_PROGRESS'],
                  },
                },
              },
            },
          },
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      // Check if there are active work orders
      if (workflow._count.workOrders > 0) {
        throw new Error(
          'Cannot delete workflow with active work orders. Please complete or cancel them first.'
        );
      }

      // Soft delete by marking inactive
      return ctx.db.workflow.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // Duplicate workflow
  duplicate: supervisorProcedure
    .input(z.object({ id: z.string(), newName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;
      const userId = ctx.session.user.id;

      const original = await ctx.db.workflow.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
      });

      if (!original) {
        throw new Error('Workflow not found or access denied');
      }

      return ctx.db.workflow.create({
        data: {
          orgId: userOrg,
          name: input.newName || `${original.name} (Copy)`,
          description: original.description,
          definition: original.definition,
          steps: original.steps,
          isActive: true,
          createdBy: userId,
        },
      });
    }),

  // Get workflow statistics
  getStats: supervisorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const workflow = await ctx.db.workflow.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        include: {
          workOrders: {
            select: {
              status: true,
              createdAt: true,
              completedAt: true,
            },
          },
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const stats = {
        totalWorkOrders: workflow.workOrders.length,
        pending: workflow.workOrders.filter((wo) => wo.status === 'PENDING').length,
        inProgress: workflow.workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length,
        completed: workflow.workOrders.filter((wo) => wo.status === 'COMPLETED').length,
        cancelled: workflow.workOrders.filter((wo) => wo.status === 'CANCELLED').length,
        averageCompletionTime: 0,
      };

      // Calculate average completion time
      const completedWorkOrders = workflow.workOrders.filter(
        (wo) => wo.status === 'COMPLETED' && wo.completedAt
      );

      if (completedWorkOrders.length > 0) {
        const totalTime = completedWorkOrders.reduce((sum, wo) => {
          const start = wo.createdAt.getTime();
          const end = wo.completedAt!.getTime();
          return sum + (end - start);
        }, 0);

        stats.averageCompletionTime = totalTime / completedWorkOrders.length;
      }

      return stats;
    }),
});
