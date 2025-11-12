import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const entitiesRouter = createTRPCRouter({
  // Get all entities for the user's organization
  getAll: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        tags: z.array(z.string()).optional(),
        parentId: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        orgId: ctx.session.user.orgId,
        isActive: true,
      };

      if (input.entityType) {
        where.entityType = input.entityType;
      }

      if (input.parentId) {
        where.parentId = input.parentId;
      }

      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags,
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.entity.findMany({
          where,
          include: {
            parent: true,
            children: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit || 50,
          skip: input.offset || 0,
        }),
        ctx.db.entity.count({ where }),
      ]);

      return { items, total };
    }),

  // Get a single entity by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entity = await ctx.db.entity.findFirst({
        where: {
          id: input.id,
          orgId: ctx.session.user.orgId,
        },
        include: {
          parent: true,
          children: true,
          formSubmissions: {
            take: 10,
            orderBy: { submittedAt: 'desc' },
          },
        },
      });

      if (!entity) {
        throw new Error('Entity not found');
      }

      return entity;
    }),

  // Create a new entity
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        name: z.string(),
        code: z.string().optional(),
        parentId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        geometry: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.entity.create({
        data: {
          orgId: ctx.session.user.orgId,
          entityType: input.entityType,
          name: input.name,
          code: input.code,
          parentId: input.parentId,
          metadata: input.metadata || {},
          geometry: input.geometry,
          tags: input.tags || [],
        },
      });
    }),

  // Update an entity
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        code: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        geometry: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify the entity belongs to the user's organization
      const entity = await ctx.db.entity.findFirst({
        where: {
          id,
          orgId: ctx.session.user.orgId,
        },
      });

      if (!entity) {
        throw new Error('Entity not found');
      }

      return ctx.db.entity.update({
        where: { id },
        data,
      });
    }),

  // Delete an entity (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the entity belongs to the user's organization
      const entity = await ctx.db.entity.findFirst({
        where: {
          id: input.id,
          orgId: ctx.session.user.orgId,
        },
      });

      if (!entity) {
        throw new Error('Entity not found');
      }

      return ctx.db.entity.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),
});

