'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type { Entity } from '@fieldform/types';
import { MapboxMap } from './MapboxMap';
import { EntityMarkers } from './EntityMarkers';
import { useMapbox } from '@/hooks/use-mapbox';
import type { Coordinates } from '@/lib/geo/geometry-utils';
import { isPointInPolygon } from '@/lib/geo/geometry-utils';

export type SelectionMode = 'click' | 'polygon' | 'circle' | 'none';

export interface EntitySelectorProps {
  /**
   * All available entities
   */
  entities: Entity[];

  /**
   * Initially selected entity IDs
   */
  initialSelection?: Set<string>;

  /**
   * Callback when selection changes
   */
  onSelectionChange: (selectedIds: Set<string>) => void;

  /**
   * Map height
   */
  height?: string;

  /**
   * Show selection tools
   */
  showTools?: boolean;

  /**
   * Enable multi-select
   */
  multiSelect?: boolean;
}

/**
 * Interactive map component for selecting entities with various selection modes
 */
export function EntitySelector({
  entities,
  initialSelection = new Set(),
  onSelectionChange,
  height = '600px',
  showTools = true,
  multiSelect = true,
}: EntitySelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelection);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('click');
  const [drawingRadius, setDrawingRadius] = useState(5); // km
  const drawRef = useRef<MapboxDraw | null>(null);

  const {
    setMap,
    mapRef,
    isLoaded,
    addSource,
    addLayer,
    removeLayer,
    removeSource,
  } = useMapbox();

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Initialize Mapbox Draw
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: selectionMode === 'polygon',
        trash: true,
      },
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.1,
          },
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        },
        // Polygon vertices
        {
          id: 'gl-draw-polygon-vertices',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-width': 2,
          },
        },
      ],
    });

    mapRef.current.addControl(draw as any);
    drawRef.current = draw;

    // Handle draw events
    mapRef.current.on('draw.create', handleDrawCreate);
    mapRef.current.on('draw.update', handleDrawUpdate);
    mapRef.current.on('draw.delete', handleDrawDelete);

    return () => {
      if (mapRef.current && drawRef.current) {
        mapRef.current.removeControl(drawRef.current as any);
        mapRef.current.off('draw.create', handleDrawCreate);
        mapRef.current.off('draw.update', handleDrawUpdate);
        mapRef.current.off('draw.delete', handleDrawDelete);
      }
    };
  }, [isLoaded, selectionMode]);

  const handleDrawCreate = (e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry.type === 'Polygon') {
        selectEntitiesInPolygon(feature.geometry.coordinates[0]);
      }
    }
  };

  const handleDrawUpdate = (e: any) => {
    const features = e.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.geometry.type === 'Polygon') {
        selectEntitiesInPolygon(feature.geometry.coordinates[0]);
      }
    }
  };

  const handleDrawDelete = () => {
    // Clear selection when polygon is deleted
    if (!multiSelect) {
      setSelectedIds(new Set());
    }
  };

  const selectEntitiesInPolygon = (coordinates: number[][]) => {
    // Convert to Coordinates format
    const polygon: Coordinates[] = coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));

    const entitiesInPolygon = entities.filter(entity => {
      if (!entity.geometry) return false;

      const entityCoords: Coordinates = {
        lat: entity.geometry.coordinates[1],
        lng: entity.geometry.coordinates[0],
      };

      return isPointInPolygon(entityCoords, polygon);
    });

    const newSelection = new Set(
      multiSelect ? selectedIds : new Set<string>()
    );

    entitiesInPolygon.forEach(entity => newSelection.add(entity.id));
    setSelectedIds(newSelection);
  };

  const handleEntityClick = (entity: Entity) => {
    if (selectionMode !== 'click') return;

    const newSelection = new Set(selectedIds);

    if (newSelection.has(entity.id)) {
      newSelection.delete(entity.id);
    } else {
      if (!multiSelect) {
        newSelection.clear();
      }
      newSelection.add(entity.id);
    }

    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(entities.map(e => e.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
  };

  const handleModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);

    if (drawRef.current) {
      drawRef.current.deleteAll();

      if (mode === 'polygon') {
        drawRef.current.changeMode('draw_polygon');
      } else {
        drawRef.current.changeMode('simple_select');
      }
    }
  };

  const handleRadiusSelect = () => {
    // For circle selection, we'll use a simpler approach
    // User clicks on map, and we select entities within radius
    setSelectionMode('circle');

    if (mapRef.current) {
      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        const center: Coordinates = {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        };

        selectEntitiesInRadius(center, drawingRadius);

        // Remove the click handler after one use
        mapRef.current?.off('click', handleMapClick);
        setSelectionMode('click');
      };

      mapRef.current.once('click', handleMapClick);
    }
  };

  const selectEntitiesInRadius = (center: Coordinates, radiusKm: number) => {
    const radiusMeters = radiusKm * 1000;

    const entitiesInRadius = entities.filter(entity => {
      if (!entity.geometry) return false;

      const entityCoords: Coordinates = {
        lat: entity.geometry.coordinates[1],
        lng: entity.geometry.coordinates[0],
      };

      // Simple distance calculation (approximation)
      const distance = getDistanceFromLatLonInKm(center, entityCoords);
      return distance <= radiusKm;
    });

    const newSelection = new Set(
      multiSelect ? selectedIds : new Set<string>()
    );

    entitiesInRadius.forEach(entity => newSelection.add(entity.id));
    setSelectedIds(newSelection);

    // Draw a circle on the map to show the selection area
    if (mapRef.current) {
      const circleId = 'radius-circle';
      const sourceId = 'radius-source';

      // Remove existing circle
      if (mapRef.current.getLayer(circleId)) {
        removeLayer(circleId);
      }
      if (mapRef.current.getSource(sourceId)) {
        removeSource(sourceId);
      }

      // Add circle
      addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat],
          },
          properties: {},
        },
      });

      addLayer({
        id: circleId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, radiusMeters / 2],
            ],
            base: 2,
          },
          'circle-color': '#3b82f6',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#3b82f6',
          'circle-stroke-width': 2,
        },
      });
    }
  };

  // Simple distance calculation (Haversine formula)
  const getDistanceFromLatLonInKm = (
    coord1: Coordinates,
    coord2: Coordinates
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(coord1.lat)) *
        Math.cos(deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Selection Tools */}
      {showTools && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
          {/* Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Selection Mode:</span>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => handleModeChange('click')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  selectionMode === 'click'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
                title="Click to select individual entities"
              >
                Click
              </button>
              <button
                onClick={() => handleModeChange('polygon')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  selectionMode === 'polygon'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
                title="Draw a polygon to select entities"
              >
                Polygon
              </button>
              <button
                onClick={handleRadiusSelect}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  selectionMode === 'circle'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
                title="Click on map to select entities within radius"
              >
                Circle
              </button>
            </div>
          </div>

          {/* Radius Input (for circle mode) */}
          {selectionMode === 'circle' && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Radius:</span>
              <input
                type="number"
                value={drawingRadius}
                onChange={(e) => setDrawingRadius(Number(e.target.value))}
                min="1"
                max="100"
                step="1"
                className="w-20 px-2 py-1 text-sm border border-border rounded-md bg-background"
              />
              <span className="text-sm text-muted-foreground">km</span>
            </div>
          )}

          {/* Selection Actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent"
            >
              Select All
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent"
              >
                Clear ({selectedIds.size})
              </button>
            )}
          </div>

          {/* Entity Count */}
          <div className="text-sm text-muted-foreground">
            {selectedIds.size} of {entities.length} selected
          </div>
        </div>
      )}

      {/* Map */}
      <MapboxMap
        initialCenter={[0, 0]}
        initialZoom={2}
        height={height}
        onLoad={setMap}
        showControls
        showGeolocate
        showScale
      />

      {mapRef.current && (
        <EntityMarkers
          map={mapRef.current}
          entities={entities}
          enableClustering={true}
          onEntityClick={handleEntityClick}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
}
