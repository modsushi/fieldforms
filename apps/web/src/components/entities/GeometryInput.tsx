'use client';

import { useState, useEffect } from 'react';
import { MapboxMap } from '@/components/map/MapboxMap';
import { useMapbox } from '@/hooks/use-mapbox';
import type { Coordinates } from '@/lib/geo/geometry-utils';
import { coordinatesToWKT, wktToCoordinates, formatCoordinates } from '@/lib/geo/geometry-utils';
import { MapPin, X } from 'lucide-react';

export interface GeometryInputProps {
  /**
   * Current geometry value (WKT Point format)
   */
  value?: string | null;

  /**
   * Callback when geometry changes
   */
  onChange: (geometry: string | null) => void;

  /**
   * Label for the input
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Required field
   */
  required?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * GeometryInput component - Allows users to select a location on a map or enter coordinates manually
 */
export function GeometryInput({
  value,
  onChange,
  label = 'Location',
  helperText = 'Click on the map to set location or enter coordinates manually',
  required = false,
  disabled = false,
}: GeometryInputProps) {
  const [showMap, setShowMap] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const { setMap, mapRef, addMarker, clearMarkers, flyTo } = useMapbox({
    onMapClick: (coords) => {
      if (!disabled) {
        handleLocationSelect(coords);
      }
    },
  });

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const coords = wktToCoordinates(value);
        setCoordinates(coords);
        setManualLat(coords.lat.toString());
        setManualLng(coords.lng.toString());
      } catch (error) {
        console.error('Invalid WKT:', error);
      }
    }
  }, [value]);

  // Update marker when coordinates change
  useEffect(() => {
    if (coordinates && mapRef.current) {
      clearMarkers();
      addMarker({
        id: 'location',
        coordinates,
        color: '#3b82f6',
      });
      flyTo(coordinates, 14);
    }
  }, [coordinates, mapRef.current]);

  const handleLocationSelect = (coords: Coordinates) => {
    setCoordinates(coords);
    setManualLat(coords.lat.toString());
    setManualLng(coords.lng.toString());
    const wkt = coordinatesToWKT(coords);
    onChange(wkt);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    const coords: Coordinates = { lat, lng };
    setCoordinates(coords);
    const wkt = coordinatesToWKT(coords);
    onChange(wkt);
    setManualMode(false);
  };

  const handleClear = () => {
    setCoordinates(null);
    setManualLat('');
    setManualLng('');
    clearMarkers();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      {/* Current Location Display */}
      {coordinates && !showMap && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <MapPin className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {formatCoordinates(coordinates)}
            </div>
            <div className="text-xs text-muted-foreground">
              Latitude: {coordinates.lat.toFixed(6)}, Longitude: {coordinates.lng.toFixed(6)}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-destructive/10 rounded text-destructive"
              title="Clear location"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!showMap && !disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
          >
            {coordinates ? 'Change Location' : 'Select on Map'}
          </button>
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
          >
            Enter Coordinates
          </button>
        </div>
      )}

      {/* Manual Coordinate Entry */}
      {manualMode && !disabled && (
        <form onSubmit={handleManualSubmit} className="p-4 bg-muted/30 rounded-lg border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="e.g., 37.7749"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                -90 to 90
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="e.g., -122.4194"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                -180 to 180
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Set Location
            </button>
          </div>
        </form>
      )}

      {/* Map */}
      {showMap && !disabled && (
        <div className="space-y-2">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">
              <strong>Click on the map</strong> to set the location
            </p>
          </div>

          <MapboxMap
            initialCenter={coordinates ? [coordinates.lng, coordinates.lat] : [0, 0]}
            initialZoom={coordinates ? 14 : 2}
            height="400px"
            onLoad={setMap}
            showControls
            showGeolocate
            showScale
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent"
            >
              Close Map
            </button>
            {coordinates && (
              <button
                type="button"
                onClick={() => {
                  setShowMap(false);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Confirm Location
              </button>
            )}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !showMap && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
