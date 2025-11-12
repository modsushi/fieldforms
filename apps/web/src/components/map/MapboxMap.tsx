'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';

export interface MapboxMapProps {
  /**
   * Initial center coordinates [lng, lat]
   */
  initialCenter?: [number, number];

  /**
   * Initial zoom level (0-22)
   */
  initialZoom?: number;

  /**
   * Map container height
   */
  height?: string;

  /**
   * Map container class name
   */
  className?: string;

  /**
   * Show navigation controls (zoom, rotation)
   */
  showControls?: boolean;

  /**
   * Show geolocation control
   */
  showGeolocate?: boolean;

  /**
   * Show scale control
   */
  showScale?: boolean;

  /**
   * Interactive or static map
   */
  interactive?: boolean;

  /**
   * Map style URL or preset
   */
  mapStyle?: 'streets' | 'satellite' | 'outdoors' | 'light' | 'dark' | string;

  /**
   * Callback when map is loaded and ready
   */
  onLoad?: (map: mapboxgl.Map) => void;

  /**
   * Callback when map is clicked
   */
  onClick?: (e: mapboxgl.MapMouseEvent) => void;

  /**
   * Callback when map view changes
   */
  onMove?: (center: [number, number], zoom: number) => void;
}

const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

/**
 * Base Mapbox GL component with controls and theming support
 */
export function MapboxMap({
  initialCenter = [0, 0],
  initialZoom = 2,
  height = '400px',
  className = '',
  showControls = true,
  showGeolocate = true,
  showScale = true,
  interactive = true,
  mapStyle = 'streets',
  onLoad,
  onClick,
  onMove,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    const mapboxToken =
      'pk.eyJ1IjoiamFic2Q5IiwiYSI6ImNtaHdmb2hnbjA0a2wybXFwd3gwa2gwejUifQ.An9g3vE7Lll1s-FLA8YLlg'; //rocess.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      setError(
        'Mapbox token not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.'
      );
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      // Determine style based on theme and mapStyle prop
      let styleUrl: string;
      if (mapStyle in MAPBOX_STYLES) {
        // Use preset
        if (mapStyle === 'streets' || mapStyle === 'outdoors') {
          // Theme-aware styles
          styleUrl =
            theme === 'dark' ? MAPBOX_STYLES.dark : MAPBOX_STYLES[mapStyle];
        } else {
          styleUrl = MAPBOX_STYLES[mapStyle as keyof typeof MAPBOX_STYLES];
        }
      } else {
        // Custom style URL
        styleUrl = mapStyle;
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initialCenter,
        zoom: initialZoom,
        interactive,
      });

      // Add controls
      if (showControls && interactive) {
        const nav = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
        });
        map.current.addControl(nav, 'top-right');
      }

      if (showGeolocate && interactive) {
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: false,
          showUserHeading: true,
        });
        map.current.addControl(geolocate, 'top-right');
      }

      if (showScale) {
        const scale = new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric',
        });
        map.current.addControl(scale, 'bottom-left');
      }

      // Event listeners
      map.current.on('load', () => {
        setIsLoaded(true);
        if (onLoad && map.current) {
          onLoad(map.current);
        }
      });

      if (onClick) {
        map.current.on('click', onClick);
      }

      if (onMove) {
        map.current.on('moveend', () => {
          if (map.current) {
            const center = map.current.getCenter();
            const zoom = map.current.getZoom();
            onMove([center.lng, center.lat], zoom);
          }
        });
      }

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map. Please check your internet connection.');
      });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map. Please try again.');
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update style when theme changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (mapStyle === 'streets' || mapStyle === 'outdoors') {
      const newStyle =
        theme === 'dark' ? MAPBOX_STYLES.dark : MAPBOX_STYLES[mapStyle];
      const currentStyle = map.current.getStyle();

      // Only update if style actually changed
      if (
        currentStyle &&
        !currentStyle.sprite?.includes(newStyle.split('/').pop() || '')
      ) {
        map.current.setStyle(newStyle);
      }
    }
  }, [theme, isLoaded, mapStyle]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 border border-border rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6 max-w-md">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className={`rounded-lg overflow-hidden ${className}`}
        style={{ height }}
      />
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg"
          style={{ height }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to access the map instance from child components
 */
export function useMapboxInstance(
  mapRef: React.RefObject<mapboxgl.Map | null>
) {
  return mapRef.current;
}
