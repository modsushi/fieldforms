import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  findEntitiesWithinRadius,
  findEntitiesWithinPolygon,
  findEntitiesWithinBounds,
  findNearestEntities,
} from '@/lib/geo/spatial-queries';

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

  // Spatial Queries

  // Find entities within a radius from a center point
  withinRadius: protectedProcedure
    .input(
      z.object({
        center: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        radiusKm: z.number().positive(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sql = findEntitiesWithinRadius(
        input.center,
        input.radiusKm,
        ctx.session.user.orgId
      );

      let entities: any[] = await ctx.db.$queryRaw(sql);

      // Filter by entity type if provided
      if (input.entityType) {
        entities = entities.filter(e => e.entityType === input.entityType);
      }

      // Parse geometry strings back to GeoJSON if needed
      entities = entities.map(e => ({
        ...e,
        distance: e.distance ? Math.round(e.distance) : null, // Round to nearest meter
      }));

      return entities;
    }),

  // Find entities within a polygon
  withinPolygon: protectedProcedure
    .input(
      z.object({
        polygon: z.array(
          z.object({
            lat: z.number(),
            lng: z.number(),
          })
        ).min(3), // Polygon must have at least 3 points
        entityType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sql = findEntitiesWithinPolygon(
        input.polygon,
        ctx.session.user.orgId
      );

      let entities: any[] = await ctx.db.$queryRaw(sql);

      // Filter by entity type if provided
      if (input.entityType) {
        entities = entities.filter(e => e.entityType === input.entityType);
      }

      return entities;
    }),

  // Find entities within a bounding box
  withinBounds: protectedProcedure
    .input(
      z.object({
        minLng: z.number(),
        minLat: z.number(),
        maxLng: z.number(),
        maxLat: z.number(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { entityType, ...bounds } = input;

      const sql = findEntitiesWithinBounds(bounds, ctx.session.user.orgId);

      let entities: any[] = await ctx.db.$queryRaw(sql);

      // Filter by entity type if provided
      if (entityType) {
        entities = entities.filter(e => e.entityType === entityType);
      }

      return entities;
    }),

  // Find nearest entities to a point
  nearest: protectedProcedure
    .input(
      z.object({
        center: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        limit: z.number().positive().optional().default(5),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sql = findNearestEntities(
        input.center,
        ctx.session.user.orgId,
        input.entityType,
        input.limit
      );

      const entities: any[] = await ctx.db.$queryRaw(sql);

      return entities.map(e => ({
        ...e,
        distance: e.distance ? Math.round(e.distance) : null,
      }));
    }),
});

