-- Add spatial indexes for better performance with PostGIS queries
-- This migration adds GIST indexes on geometry columns for efficient spatial queries

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial index on entities geometry
-- This allows fast queries like "find entities within radius" or "entities within polygon"
-- Note: We're using ST_GeomFromText to convert WKT strings to geometry for indexing
CREATE INDEX IF NOT EXISTS idx_entities_geometry_gist
ON entities USING GIST (ST_GeomFromText(geometry, 4326))
WHERE geometry IS NOT NULL;

-- Add spatial index on form_submissions location
CREATE INDEX IF NOT EXISTS idx_form_submissions_location_gist
ON form_submissions USING GIST (ST_GeomFromText(location, 4326))
WHERE location IS NOT NULL;

-- Add spatial index on markers location
CREATE INDEX IF NOT EXISTS idx_markers_location_gist
ON markers USING GIST (ST_GeomFromText(location, 4326))
WHERE location IS NOT NULL;

-- Add regular indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entities_is_active ON entities(is_active);
CREATE INDEX IF NOT EXISTS idx_entities_org_active ON entities(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entities_type_active ON entities(entity_type, is_active);

-- Add index for entity code lookups (QR/barcode scanning)
CREATE INDEX IF NOT EXISTS idx_entities_code ON entities(code) WHERE code IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_entities_geometry_gist IS 'Spatial index for fast proximity and boundary queries on entities';
COMMENT ON INDEX idx_form_submissions_location_gist IS 'Spatial index for form submission locations';
COMMENT ON INDEX idx_markers_location_gist IS 'Spatial index for marker locations in location-based workflows';
