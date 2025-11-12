'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Coordinates } from '@/lib/geo/geometry-utils';

export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  popup?: string | HTMLElement;
  color?: string;
  element?: HTMLElement;
}

export interface UseMapboxOptions {
  onMarkerClick?: (markerId: string) => void;
  onMapClick?: (coordinates: Coordinates) => void;
}

/**
 * Custom hook for managing Mapbox map instance, markers, and interactions
 */
export function useMapbox(options: UseMapboxOptions = {}) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [center, setCenter] = useState<Coordinates>({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(2);

  /**
   * Store map instance
   */
  const setMap = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setIsLoaded(true);

    // Update center and zoom when map moves
    map.on('move', () => {
      const mapCenter = map.getCenter();
      setCenter({ lat: mapCenter.lat, lng: mapCenter.lng });
      setZoom(map.getZoom());
    });

    // Handle map clicks
    if (options.onMapClick) {
      map.on('click', (e) => {
        options.onMapClick?.({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        });
      });
    }
  }, [options.onMapClick]);

  /**
   * Add a marker to the map
   */
  const addMarker = useCallback((marker: MapMarker) => {
    if (!mapRef.current) return;

    // Remove existing marker if it exists
    if (markersRef.current.has(marker.id)) {
      markersRef.current.get(marker.id)?.remove();
    }

    const markerInstance = new mapboxgl.Marker({
      color: marker.color || '#3b82f6',
      element: marker.element,
    })
      .setLngLat([marker.coordinates.lng, marker.coordinates.lat]);

    if (marker.popup) {
      const popup = new mapboxgl.Popup({ offset: 25 });
      if (typeof marker.popup === 'string') {
        popup.setHTML(marker.popup);
      } else {
        popup.setDOMContent(marker.popup);
      }
      markerInstance.setPopup(popup);
    }

    // Handle marker click
    markerInstance.getElement().addEventListener('click', (e) => {
      e.stopPropagation();
      options.onMarkerClick?.(marker.id);
    });

    markerInstance.addTo(mapRef.current);
    markersRef.current.set(marker.id, markerInstance);
  }, [options.onMarkerClick]);

  /**
   * Add multiple markers at once
   */
  const addMarkers = useCallback((markers: MapMarker[]) => {
    markers.forEach(addMarker);
  }, [addMarker]);

  /**
   * Remove a marker from the map
   */
  const removeMarker = useCallback((markerId: string) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      marker.remove();
      markersRef.current.delete(markerId);
    }
  }, []);

  /**
   * Remove all markers from the map
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
  }, []);

  /**
   * Fly to a specific location
   */
  const flyTo = useCallback((coordinates: Coordinates, zoomLevel?: number) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: zoomLevel !== undefined ? zoomLevel : mapRef.current.getZoom(),
      essential: true,
    });
  }, []);

  /**
   * Fit map to show all markers
   */
  const fitBounds = useCallback((padding: number = 50) => {
    if (!mapRef.current || markersRef.current.size === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    markersRef.current.forEach(marker => {
      bounds.extend(marker.getLngLat());
    });

    mapRef.current.fitBounds(bounds, {
      padding,
      maxZoom: 15,
    });
  }, []);

  /**
   * Fit map to specific coordinates
   */
  const fitCoordinates = useCallback((coordinates: Coordinates[], padding: number = 50) => {
    if (!mapRef.current || coordinates.length === 0) return;

    if (coordinates.length === 1) {
      // Single point - just fly to it
      flyTo(coordinates[0], 14);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => {
      bounds.extend([coord.lng, coord.lat]);
    });

    mapRef.current.fitBounds(bounds, {
      padding,
      maxZoom: 15,
    });
  }, [flyTo]);

  /**
   * Update marker position
   */
  const updateMarker = useCallback((markerId: string, coordinates: Coordinates) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      marker.setLngLat([coordinates.lng, coordinates.lat]);
    }
  }, []);

  /**
   * Toggle marker popup
   */
  const togglePopup = useCallback((markerId: string) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      const popup = marker.getPopup();
      if (popup) {
        if (popup.isOpen()) {
          popup.remove();
        } else {
          popup.addTo(mapRef.current!);
        }
      }
    }
  }, []);

  /**
   * Resize map (useful when container size changes)
   */
  const resize = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  /**
   * Get current map center
   */
  const getCenter = useCallback((): Coordinates => {
    if (!mapRef.current) return { lat: 0, lng: 0 };
    const mapCenter = mapRef.current.getCenter();
    return { lat: mapCenter.lat, lng: mapCenter.lng };
  }, []);

  /**
   * Get current zoom level
   */
  const getZoom = useCallback((): number => {
    return mapRef.current?.getZoom() || 2;
  }, []);

  /**
   * Add a source to the map
   */
  const addSource = useCallback((sourceId: string, source: mapboxgl.AnySourceData) => {
    if (!mapRef.current) return;
    if (!mapRef.current.getSource(sourceId)) {
      mapRef.current.addSource(sourceId, source);
    }
  }, []);

  /**
   * Add a layer to the map
   */
  const addLayer = useCallback((layer: mapboxgl.AnyLayer) => {
    if (!mapRef.current) return;
    if (!mapRef.current.getLayer(layer.id)) {
      mapRef.current.addLayer(layer);
    }
  }, []);

  /**
   * Remove a layer from the map
   */
  const removeLayer = useCallback((layerId: string) => {
    if (!mapRef.current) return;
    if (mapRef.current.getLayer(layerId)) {
      mapRef.current.removeLayer(layerId);
    }
  }, []);

  /**
   * Remove a source from the map
   */
  const removeSource = useCallback((sourceId: string) => {
    if (!mapRef.current) return;
    if (mapRef.current.getSource(sourceId)) {
      mapRef.current.removeSource(sourceId);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    // State
    isLoaded,
    center,
    zoom,
    mapRef,

    // Methods
    setMap,
    addMarker,
    addMarkers,
    removeMarker,
    clearMarkers,
    updateMarker,
    flyTo,
    fitBounds,
    fitCoordinates,
    togglePopup,
    resize,
    getCenter,
    getZoom,
    addSource,
    addLayer,
    removeLayer,
    removeSource,
  };
}
