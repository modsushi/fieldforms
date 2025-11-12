/**
 * Spatial query helpers using PostGIS
 * These functions generate SQL for spatial operations
 */

import type { Coordinates } from './geometry-utils';
import { Prisma } from '@fieldform/database';

export interface SpatialQueryResult {
  id: string;
  distance?: number;
}

/**
 * Generate SQL for finding entities within a radius
 * Uses ST_DWithin for efficient radius queries
 *
 * @param center - Center point coordinates
 * @param radiusKm - Radius in kilometers
 * @param orgId - Organization ID to filter by
 * @returns Prisma raw SQL
 */
export function findEntitiesWithinRadius(
  center: Coordinates,
  radiusKm: number,
  orgId: string
) {
  // Convert km to meters for PostGIS
  const radiusMeters = radiusKm * 1000;

  // SRID 4326 is WGS84 (standard lat/lng)
  // ST_DWithin is more efficient than ST_Distance for radius queries
  const sql = Prisma.sql`
    SELECT
      id,
      name,
      entity_type as "entityType",
      code,
      metadata,
      geometry,
      tags,
      is_active as "isActive",
      parent_id as "parentId",
      ST_Distance(
        ST_GeomFromText(geometry, 4326)::geography,
        ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography
      ) as distance
    FROM entities
    WHERE org_id = ${orgId}::uuid
      AND is_active = true
      AND geometry IS NOT NULL
      AND ST_DWithin(
        ST_GeomFromText(geometry, 4326)::geography,
        ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY distance ASC
  `;

  return sql;
}

/**
 * Generate SQL for finding entities within a polygon
 *
 * @param polygon - Array of coordinates forming a closed polygon
 * @param orgId - Organization ID
 * @returns Prisma raw SQL
 */
export function findEntitiesWithinPolygon(
  polygon: Coordinates[],
  orgId: string
) {
  // Ensure polygon is closed (first point === last point)
  const closedPolygon = [...polygon];
  if (
    polygon[0].lat !== polygon[polygon.length - 1].lat ||
    polygon[0].lng !== polygon[polygon.length - 1].lng
  ) {
    closedPolygon.push(polygon[0]);
  }

  // Create WKT polygon string: POLYGON((lng lat, lng lat, ...))
  const polygonWKT = `POLYGON((${closedPolygon
    .map(p => `${p.lng} ${p.lat}`)
    .join(', ')}))`;

  const sql = Prisma.sql`
    SELECT
      id,
      name,
      entity_type as "entityType",
      code,
      metadata,
      geometry,
      tags,
      is_active as "isActive",
      parent_id as "parentId"
    FROM entities
    WHERE org_id = ${orgId}::uuid
      AND is_active = true
      AND geometry IS NOT NULL
      AND ST_Contains(
        ST_GeomFromText(${polygonWKT}, 4326),
        ST_GeomFromText(geometry, 4326)
      )
  `;

  return sql;
}

/**
 * Generate SQL for finding entities within a bounding box
 *
 * @param bounds - Bounding box {minLng, minLat, maxLng, maxLat}
 * @param orgId - Organization ID
 * @returns Prisma raw SQL
 */
export function findEntitiesWithinBounds(
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  },
  orgId: string
) {
  const sql = Prisma.sql`
    SELECT
      id,
      name,
      entity_type as "entityType",
      code,
      metadata,
      geometry,
      tags,
      is_active as "isActive",
      parent_id as "parentId"
    FROM entities
    WHERE org_id = ${orgId}::uuid
      AND is_active = true
      AND geometry IS NOT NULL
      AND ST_GeomFromText(geometry, 4326) && ST_MakeEnvelope(
        ${bounds.minLng}, ${bounds.minLat},
        ${bounds.maxLng}, ${bounds.maxLat},
        4326
      )
  `;

  return sql;
}

/**
 * Calculate distance between two entities
 *
 * @param entity1Id - First entity ID
 * @param entity2Id - Second entity ID
 * @returns Prisma raw SQL to get distance in meters
 */
export function calculateEntityDistance(
  entity1Id: string,
  entity2Id: string
) {
  const sql = Prisma.sql`
    SELECT
      ST_Distance(
        (SELECT ST_GeomFromText(geometry, 4326)::geography FROM entities WHERE id = ${entity1Id}::uuid),
        (SELECT ST_GeomFromText(geometry, 4326)::geography FROM entities WHERE id = ${entity2Id}::uuid)
      ) as distance
  `;

  return sql;
}

/**
 * Find nearest entity to a point
 *
 * @param center - Center point
 * @param orgId - Organization ID
 * @param entityType - Optional entity type filter
 * @param limit - Number of nearest entities to return
 * @returns Prisma raw SQL
 */
export function findNearestEntities(
  center: Coordinates,
  orgId: string,
  entityType?: string,
  limit: number = 1
) {
  const typeFilter = entityType
    ? Prisma.sql`AND entity_type = ${entityType}`
    : Prisma.empty;

  const sql = Prisma.sql`
    SELECT
      id,
      name,
      entity_type as "entityType",
      code,
      metadata,
      geometry,
      tags,
      is_active as "isActive",
      parent_id as "parentId",
      ST_Distance(
        ST_GeomFromText(geometry, 4326)::geography,
        ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography
      ) as distance
    FROM entities
    WHERE org_id = ${orgId}::uuid
      AND is_active = true
      AND geometry IS NOT NULL
      ${typeFilter}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return sql;
}

/**
 * Check if a point is within an entity's boundary (for site/polygon entities)
 *
 * @param point - Point to check
 * @param entityId - Entity ID with polygon geometry
 * @returns Prisma raw SQL
 */
export function isPointInEntityBoundary(
  point: Coordinates,
  entityId: string
) {
  const sql = Prisma.sql`
    SELECT
      ST_Contains(
        ST_GeomFromText(geometry, 4326),
        ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)
      ) as contains
    FROM entities
    WHERE id = ${entityId}::uuid
      AND geometry IS NOT NULL
  `;

  return sql;
}

/**
 * Get all entities within a parent entity's boundary
 * Useful for finding assets within a site
 *
 * @param parentEntityId - Parent entity ID with polygon boundary
 * @param orgId - Organization ID
 * @returns Prisma raw SQL
 */
export function findEntitiesWithinParentBoundary(
  parentEntityId: string,
  orgId: string
) {
  const sql = Prisma.sql`
    SELECT
      e.id,
      e.name,
      e.entity_type as "entityType",
      e.code,
      e.metadata,
      e.geometry,
      e.tags,
      e.is_active as "isActive",
      e.parent_id as "parentId"
    FROM entities e
    CROSS JOIN (
      SELECT geometry FROM entities WHERE id = ${parentEntityId}::uuid
    ) parent
    WHERE e.org_id = ${orgId}::uuid
      AND e.is_active = true
      AND e.geometry IS NOT NULL
      AND parent.geometry IS NOT NULL
      AND ST_Contains(
        ST_GeomFromText(parent.geometry, 4326),
        ST_GeomFromText(e.geometry, 4326)
      )
  `;

  return sql;
}

/**
 * Find entities along a route (within a buffer distance of a line)
 *
 * @param route - Array of coordinates forming a route
 * @param bufferMeters - Buffer distance in meters
 * @param orgId - Organization ID
 * @returns Prisma raw SQL
 */
export function findEntitiesAlongRoute(
  route: Coordinates[],
  bufferMeters: number,
  orgId: string
) {
  // Create WKT linestring: LINESTRING(lng lat, lng lat, ...)
  const lineWKT = `LINESTRING(${route.map(p => `${p.lng} ${p.lat}`).join(', ')})`;

  const sql = Prisma.sql`
    SELECT
      id,
      name,
      entity_type as "entityType",
      code,
      metadata,
      geometry,
      tags,
      is_active as "isActive",
      parent_id as "parentId",
      ST_Distance(
        ST_GeomFromText(geometry, 4326)::geography,
        ST_GeomFromText(${lineWKT}, 4326)::geography
      ) as distance_from_route
    FROM entities
    WHERE org_id = ${orgId}::uuid
      AND is_active = true
      AND geometry IS NOT NULL
      AND ST_DWithin(
        ST_GeomFromText(geometry, 4326)::geography,
        ST_GeomFromText(${lineWKT}, 4326)::geography,
        ${bufferMeters}
      )
    ORDER BY distance_from_route ASC
  `;

  return sql;
}

/**
 * Get entity density in a grid (for heatmap visualization)
 *
 * @param bounds - Bounding box
 * @param gridSize - Grid cell size (degrees)
 * @param orgId - Organization ID
 * @returns Prisma raw SQL
 */
export function getEntityDensityGrid(
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  },
  gridSize: number,
  orgId: string
) {
  const sql = Prisma.sql`
    SELECT
      ST_X(grid.geom) as lng,
      ST_Y(grid.geom) as lat,
      COUNT(e.id) as count
    FROM (
      SELECT
        ST_SetSRID(
          ST_MakePoint(
            x * ${gridSize} + ${bounds.minLng},
            y * ${gridSize} + ${bounds.minLat}
          ),
          4326
        ) as geom
      FROM generate_series(
        0,
        CEIL((${bounds.maxLng} - ${bounds.minLng}) / ${gridSize})::int
      ) as x
      CROSS JOIN generate_series(
        0,
        CEIL((${bounds.maxLat} - ${bounds.minLat}) / ${gridSize})::int
      ) as y
    ) grid
    LEFT JOIN entities e ON
      e.org_id = ${orgId}::uuid
      AND e.is_active = true
      AND e.geometry IS NOT NULL
      AND ST_DWithin(
        ST_GeomFromText(e.geometry, 4326),
        grid.geom,
        ${gridSize} * 111000  -- Convert degrees to approximate meters
      )
    GROUP BY ST_X(grid.geom), ST_Y(grid.geom)
    HAVING COUNT(e.id) > 0
  `;

  return sql;
}
