# Setting Up Spatial Indexes

This guide shows you how to apply the spatial indexes for improved map performance.

## Prerequisites

1. PostgreSQL with PostGIS extension installed
2. Database connection configured in `.env`
3. Entities with geometry data

## Step 1: Verify PostGIS is Installed

Connect to your database:
```bash
psql $DATABASE_URL
```

Check if PostGIS is available:
```sql
SELECT PostGIS_version();
```

If you get an error, install PostGIS first.

## Step 2: Apply the Migration

From the project root:

```bash
# Option 1: Using psql directly
psql $DATABASE_URL < packages/database/prisma/migrations/add_spatial_indexes.sql

# Option 2: Using connection string from .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldform"
psql $DATABASE_URL < packages/database/prisma/migrations/add_spatial_indexes.sql
```

## Step 3: Verify Indexes Were Created

Connect to database and check indexes:

```sql
-- List all indexes on entities table
\d+ entities

-- Check if spatial index exists
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'entities'
  AND indexname = 'idx_entities_geometry_gist';
```

You should see output showing the GIST index on geometry column.

## Step 4: Test a Spatial Query

Try a simple radius query:

```sql
-- Find entities within 5km of a point (San Francisco)
SELECT
  id,
  name,
  entity_type,
  ST_Distance(
    ST_GeomFromText(geometry, 4326)::geography,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
  ) / 1000 as distance_km
FROM entities
WHERE org_id = 'your-org-id'::uuid
  AND geometry IS NOT NULL
  AND ST_DWithin(
    ST_GeomFromText(geometry, 4326)::geography,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    5000  -- 5km in meters
  )
ORDER BY distance_km;
```

## Performance Testing

### Before Indexes
```sql
EXPLAIN ANALYZE
SELECT * FROM entities
WHERE ST_DWithin(
  ST_GeomFromText(geometry, 4326)::geography,
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
  5000
);
```
Expected: Seq Scan (slow)

### After Indexes
Same query should show:
Expected: Index Scan using idx_entities_geometry_gist (fast)

## Troubleshooting

### PostGIS Not Installed

**Error:** `ERROR: type "geography" does not exist`

**Solution:** Install PostGIS extension:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-14-postgis-3
```

**macOS:**
```bash
brew install postgis
```

**Then enable in database:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Permission Denied

**Error:** `ERROR: permission denied to create extension "postgis"`

**Solution:** Connect as superuser:
```bash
psql -U postgres $DATABASE_URL
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Index Already Exists

**Error:** `ERROR: relation "idx_entities_geometry_gist" already exists`

**Solution:** Migration already applied, skip this step.

### Geometry Column NULL

**Error:** Queries return no results

**Solution:** Add geometry data to entities:

```sql
-- Update an entity with geometry (San Francisco)
UPDATE entities
SET geometry = 'POINT(-122.4194 37.7749)'
WHERE id = 'your-entity-id';

-- Or using ST_AsText
UPDATE entities
SET geometry = ST_AsText(ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326))
WHERE id = 'your-entity-id';
```

## Adding Test Data

To test the map features, you'll need entities with geometry:

```sql
-- Add test entities with locations (San Francisco area)
INSERT INTO entities (
  id,
  org_id,
  entity_type,
  name,
  geometry,
  is_active
) VALUES
  (
    uuid_generate_v4(),
    'your-org-id'::uuid,
    'site',
    'Downtown Office',
    'POINT(-122.4194 37.7749)',
    true
  ),
  (
    uuid_generate_v4(),
    'your-org-id'::uuid,
    'asset',
    'Golden Gate Bridge',
    'POINT(-122.4783 37.8199)',
    true
  ),
  (
    uuid_generate_v4(),
    'your-org-id'::uuid,
    'equipment',
    'Pier 39 Equipment',
    'POINT(-122.4098 37.8087)',
    true
  );
```

## Verification Checklist

- [ ] PostGIS extension enabled
- [ ] Spatial indexes created
- [ ] Test query returns results
- [ ] Query uses index (check EXPLAIN ANALYZE)
- [ ] Entities visible on map at `/dashboard/entities` (map view)
- [ ] Map work order page works at `/dashboard/work-orders/map`
- [ ] Selection tools work (Click, Polygon, Circle)
- [ ] Work order can be created from map selection

## Next Steps

Once spatial indexes are set up:
1. Add geometry data to your entities
2. Test the map view at `/dashboard/entities`
3. Create work orders from map at `/dashboard/work-orders/map`
4. Use spatial queries in your workflows

## Need Help?

- Check the PostGIS documentation: https://postgis.net/docs/
- Review the spatial query examples in `PHASE-2-MAP-WORK-ORDERS.md`
- Test queries in psql before using in application
