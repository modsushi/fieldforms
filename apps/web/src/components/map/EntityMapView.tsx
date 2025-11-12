'use client';

import { useState, useEffect } from 'react';
import type { Entity } from '@fieldform/types';
import { MapboxMap } from './MapboxMap';
import { EntityMarkers } from './EntityMarkers';
import { useMapbox } from '@/hooks/use-mapbox';
import { calculateBoundingBox, getBoundingBoxCenter } from '@/lib/geo/geometry-utils';

export interface EntityMapViewProps {
  /**
   * Entities to display on the map
   */
  entities: Entity[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Enable entity selection
   */
  selectable?: boolean;

  /**
   * Selected entity IDs
   */
  selectedIds?: Set<string>;

  /**
   * Callback when entity selection changes
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;

  /**
   * Callback when entity is clicked
   */
  onEntityClick?: (entity: Entity) => void;

  /**
   * Map height
   */
  height?: string;

  /**
   * Show entity filters
   */
  showFilters?: boolean;

  /**
   * Enable clustering
   */
  enableClustering?: boolean;
}

/**
 * Full-featured entity map view with filtering and selection
 */
export function EntityMapView({
  entities,
  isLoading = false,
  selectable = false,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  onEntityClick,
  height = '600px',
  showFilters = true,
  enableClustering = true,
}: EntityMapViewProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedIds = externalSelectedIds ?? internalSelectedIds;

  const {
    setMap,
    mapRef,
    isLoaded: mapLoaded,
    fitCoordinates,
  } = useMapbox();

  // Filter entities based on type and search
  const filteredEntities = entities.filter(entity => {
    const matchesType = !entityTypeFilter || entity.entityType === entityTypeFilter;
    const matchesSearch =
      !searchQuery ||
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.code?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Get unique entity types
  const entityTypes = Array.from(new Set(entities.map(e => e.entityType))).sort();

  // Fit map to show all entities on initial load
  useEffect(() => {
    if (!mapLoaded || filteredEntities.length === 0) return;

    const entitiesWithGeometry = filteredEntities.filter(e => e.geometry);
    if (entitiesWithGeometry.length === 0) return;

    const coords = entitiesWithGeometry.map(e => ({
      lat: e.geometry!.coordinates[1],
      lng: e.geometry!.coordinates[0],
    }));

    // Small delay to ensure map is fully ready
    setTimeout(() => {
      fitCoordinates(coords, 80);
    }, 100);
  }, [mapLoaded, filteredEntities.length]); // Only run when map loads or entity count changes

  const handleEntityClick = (entity: Entity) => {
    if (selectable) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(entity.id)) {
        newSelected.delete(entity.id);
      } else {
        newSelected.add(entity.id);
      }

      if (!externalSelectedIds) {
        setInternalSelectedIds(newSelected);
      }
      onSelectionChange?.(newSelected);
    }

    onEntityClick?.(entity);
  };

  const handleClearSelection = () => {
    const empty = new Set<string>();
    if (!externalSelectedIds) {
      setInternalSelectedIds(empty);
    }
    onSelectionChange?.(empty);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredEntities.map(e => e.id));
    if (!externalSelectedIds) {
      setInternalSelectedIds(allIds);
    }
    onSelectionChange?.(allIds);
  };

  // Calculate center from entities with geometry
  const defaultCenter = (): [number, number] => {
    const entitiesWithGeom = entities.filter(e => e.geometry);
    if (entitiesWithGeom.length === 0) return [0, 0];

    const coords = entitiesWithGeom.map(e => ({
      lat: e.geometry!.coordinates[1],
      lng: e.geometry!.coordinates[0],
    }));

    const bounds = calculateBoundingBox(coords);
    const center = getBoundingBoxCenter(bounds);
    return [center.lng, center.lat];
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter || ''}
            onChange={(e) => setEntityTypeFilter(e.target.value || null)}
            className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* Selection Controls */}
          {selectable && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent"
              >
                Select All
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent"
                >
                  Clear ({selectedIds.size})
                </button>
              )}
            </div>
          )}

          {/* Entity Count */}
          <div className="text-sm text-muted-foreground">
            {filteredEntities.length} of {entities.length} entities
            {filteredEntities.filter(e => e.geometry).length < filteredEntities.length && (
              <span className="ml-1 text-xs">
                ({filteredEntities.length - filteredEntities.filter(e => e.geometry).length} without location)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading entities...</p>
            </div>
          </div>
        )}

        <MapboxMap
          initialCenter={defaultCenter()}
          initialZoom={entities.length > 0 ? 10 : 2}
          height={height}
          onLoad={setMap}
          showControls
          showGeolocate
          showScale
        />

        {mapRef.current && (
          <EntityMarkers
            map={mapRef.current}
            entities={filteredEntities}
            enableClustering={enableClustering}
            onEntityClick={handleEntityClick}
            selectedIds={selectedIds}
          />
        )}
      </div>
    </div>
  );
}
