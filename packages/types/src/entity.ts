import { z } from 'zod';

// GeoJSON Point
export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export type GeoPoint = z.infer<typeof geoPointSchema>;

// Entity
export const entitySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  entityType: z.string(),
  parentId: z.string().uuid().optional(),
  name: z.string(),
  code: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  geometry: geoPointSchema.optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Entity = z.infer<typeof entitySchema>;

// Entity Relationship
export const entityRelationshipSchema = z.object({
  id: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  relationshipType: z.string(),
  properties: z.record(z.any()).default({}),
  validFrom: z.date(),
  validTo: z.date().optional(),
});

export type EntityRelationship = z.infer<typeof entityRelationshipSchema>;

