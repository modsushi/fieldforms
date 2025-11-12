'use client';

import { useState, useEffect } from 'react';
import type { FormField } from '@fieldform/types';
import type { EntityCreationData } from '@/lib/forms/entity-extraction';
import { MapPin, X, Plus, Edit2 } from 'lucide-react';
import { Button } from '@fieldform/ui';
import { coordinatesToWKT, wktToCoordinates, formatCoordinates } from '@/lib/geo/geometry-utils';

interface EntityCreatorFieldProps {
  field: FormField;
  value: EntityCreationData | null;
  onChange: (data: EntityCreationData | null) => void;
  error?: string;
}

type CreationState = 'empty' | 'creating' | 'created';

export function EntityCreatorField({
  field,
  value,
  onChange,
  error,
}: EntityCreatorFieldProps) {
  const [state, setState] = useState<CreationState>(value ? 'created' : 'empty');
  const [name, setName] = useState(value?.name || '');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const options = field.options?.value;
  const entityType = options?.entityType || 'site';
  const mode = options?.mode || 'minimal';
  const captureLocation = options?.minimalConfig?.captureLocation !== false;

  // Parse initial location from WKT
  useEffect(() => {
    if (value?.geometry) {
      try {
        const coords = wktToCoordinates(value.geometry);
        setLocation(coords);
      } catch (error) {
        console.error('Failed to parse geometry:', error);
      }
    }
  }, [value?.geometry]);

  // Auto-capture location when opening create form
  const handleStartCreating = () => {
    setState('creating');
    if (captureLocation) {
      captureCurrentLocation();
    }
  };

  const captureCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsCapturingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setIsCapturingLocation(false);
        },
        (error) => {
          console.error('Failed to get location:', error);
          setIsCapturingLocation(false);
          alert('Failed to capture location. Please enter manually or try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter an entity name');
      return;
    }

    const entityData: EntityCreationData = {
      name: name.trim(),
      geometry: location ? coordinatesToWKT(location) : undefined,
      metadata: {},
    };

    onChange(entityData);
    setState('created');
  };

  const handleEdit = () => {
    setState('creating');
  };

  const handleClear = () => {
    setName('');
    setLocation(null);
    onChange(null);
    setState('empty');
  };

  const handleCancel = () => {
    if (value) {
      // Revert to previous value
      setName(value.name);
      setState('created');
    } else {
      handleClear();
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'site':
        return '📍';
      case 'asset':
        return '📦';
      case 'equipment':
        return '🔧';
      case 'location':
        return '🗺️';
      default:
        return '🏢';
    }
  };

  const getEntityTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Empty state
  if (state === 'empty') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </label>
        <Button
          type="button"
          onClick={handleStartCreating}
          variant="outline"
          className="w-full gap-2 border-dashed border-2 h-auto py-4"
        >
          <Plus className="h-5 w-5" />
          <span>Create New {getEntityTypeLabel(entityType)}</span>
        </Button>
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Creating state
  if (state === 'creating') {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </label>
        
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-2xl">{getEntityTypeIcon(entityType)}</span>
            <span>New {getEntityTypeLabel(entityType)}</span>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${entityType} name...`}
              className="w-full px-3 py-2 border rounded-md bg-background"
              autoFocus
            />
          </div>

          {/* Location capture */}
          {captureLocation && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Location</label>
              {location ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {formatCoordinates(location)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocation(null)}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureCurrentLocation}
                  disabled={isCapturingLocation}
                  className="w-full gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {isCapturingLocation ? 'Capturing...' : 'Capture Current Location'}
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1"
            >
              Save Entity
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Created state
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </label>
      
      <div className="flex items-start gap-3 p-4 border rounded-lg bg-card">
        <span className="text-3xl">{getEntityTypeIcon(entityType)}</span>
        <div className="flex-1 space-y-1">
          <div className="font-medium">{value?.name}</div>
          <div className="text-sm text-muted-foreground">
            {getEntityTypeLabel(entityType)}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {formatCoordinates(location)}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleEdit}
            className="p-2 hover:bg-accent rounded-md"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 hover:bg-destructive/10 rounded-md text-destructive"
            title="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

