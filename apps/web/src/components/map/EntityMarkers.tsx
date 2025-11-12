'use client';

import { useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Entity } from '@fieldform/types';
import { wktToCoordinates } from '@/lib/geo/geometry-utils';

export interface EntityMarkersProps {
  /**
   * Map instance from Mapbox
   */
  map: mapboxgl.Map;

  /**
   * Entities to display on map
   */
  entities: Entity[];

  /**
   * Enable marker clustering for better performance
   */
  enableClustering?: boolean;

  /**
   * Callback when entity marker is clicked
   */
  onEntityClick?: (entity: Entity) => void;

  /**
   * Selected entity IDs
   */
  selectedIds?: Set<string>;
}

/**
 * Get marker color based on entity type
 */
function getEntityColor(entityType: string): string {
  const colors: Record<string, string> = {
    site: '#10b981', // green
    asset: '#3b82f6', // blue
    equipment: '#f59e0b', // orange
    location: '#8b5cf6', // purple
    vehicle: '#ef4444', // red
  };

  return colors[entityType.toLowerCase()] || '#6b7280'; // default gray
}

/**
 * Get marker icon based on entity type
 */
function getEntityIcon(entityType: string): string {
  const icons: Record<string, string> = {
    site: '📍',
    asset: '📦',
    equipment: '🔧',
    location: '📌',
    vehicle: '🚗',
  };

  return icons[entityType.toLowerCase()] || '📍';
}

/**
 * Component to render entities as markers on a Mapbox map with optional clustering
 */
export function EntityMarkers({
  map,
  entities,
  enableClustering = true,
  onEntityClick,
  selectedIds = new Set(),
}: EntityMarkersProps) {
  // Filter entities that have geometry data
  const entitiesWithGeometry = useMemo(() => {
    return entities.filter(entity => entity.geometry);
  }, [entities]);

  // Convert entities to GeoJSON for clustering
  const geoJsonData = useMemo(() => {
    const features = entitiesWithGeometry.map(entity => {
      const geometry = entity.geometry!;

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: geometry.coordinates,
        },
        properties: {
          id: entity.id,
          name: entity.name,
          entityType: entity.entityType,
          code: entity.code,
          color: getEntityColor(entity.entityType),
          icon: getEntityIcon(entity.entityType),
          isSelected: selectedIds.has(entity.id),
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [entitiesWithGeometry, selectedIds]);

  useEffect(() => {
    if (!map || entitiesWithGeometry.length === 0) return;

    const sourceId = 'entities';
    const unclusteredLayerId = 'unclustered-entities';
    const clustersLayerId = 'entity-clusters';
    const clusterCountLayerId = 'cluster-count';

    // Wait for map to be loaded
    const setupLayers = () => {
      // Remove existing layers and source
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      if (map.getLayer(clustersLayerId)) map.removeLayer(clustersLayerId);
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // Add source with clustering
      map.addSource(sourceId, {
        type: 'geojson',
        data: geoJsonData,
        cluster: enableClustering,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      if (enableClustering) {
        // Add clusters layer
        map.addLayer({
          id: clustersLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3b82f6', // blue for < 10
              10,
              '#f59e0b', // orange for 10-30
              30,
              '#ef4444', // red for > 30
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, // < 10
              10,
              20, // 10-30
              30,
              25, // > 30
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Add cluster count layer
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Handle cluster clicks - zoom in
        map.on('click', clustersLayerId, (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [clustersLayerId],
          });

          if (features.length > 0) {
            const clusterId = features[0].properties?.cluster_id;
            const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              const geometry = features[0].geometry;
              if (geometry.type === 'Point') {
                map.easeTo({
                  center: geometry.coordinates as [number, number],
                  zoom: zoom,
                });
              }
            });
          }
        });

        // Change cursor on cluster hover
        map.on('mouseenter', clustersLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', clustersLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Add unclustered points layer
      map.addLayer({
        id: unclusteredLayerId,
        type: 'circle',
        source: sourceId,
        filter: enableClustering ? ['!', ['has', 'point_count']] : undefined,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'case',
            ['get', 'isSelected'],
            10, // selected
            7, // normal
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': [
            'case',
            ['get', 'isSelected'],
            3, // selected
            2, // normal
          ],
          'circle-stroke-color': [
            'case',
            ['get', 'isSelected'],
            '#fbbf24', // yellow for selected
            '#ffffff', // white for normal
          ],
        },
      });

      // Add click handler for individual entities
      map.on('click', unclusteredLayerId, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const entityId = feature.properties?.id;

          if (entityId && onEntityClick) {
            const entity = entities.find(e => e.id === entityId);
            if (entity) {
              onEntityClick(entity);
            }
          }
        }
      });

      // Change cursor on entity hover
      map.on('mouseenter', unclusteredLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', unclusteredLayerId, () => {
        map.getCanvas().style.cursor = '';
      });

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
      });

      map.on('mouseenter', unclusteredLayerId, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const { name, entityType, code, icon } = feature.properties || {};
          const geometry = feature.geometry;

          if (geometry.type === 'Point') {
            popup
              .setLngLat(geometry.coordinates as [number, number])
              .setHTML(
                `
                <div class="text-sm">
                  <div class="font-semibold flex items-center gap-2">
                    <span>${icon}</span>
                    <span>${name}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    <div>Type: ${entityType}</div>
                    ${code ? `<div>Code: ${code}</div>` : ''}
                  </div>
                </div>
              `
              )
              .addTo(map);
          }
        }
      });

      map.on('mouseleave', unclusteredLayerId, () => {
        popup.remove();
      });
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('load', setupLayers);
    }

    // Cleanup
    return () => {
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      if (map.getLayer(clustersLayerId)) map.removeLayer(clustersLayerId);
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, geoJsonData, enableClustering, entities, onEntityClick]);

  return null; // This component doesn't render anything itself
}
