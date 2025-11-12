'use client';

import { FormField } from '@fieldform/types';
import { Label, Button } from '@fieldform/ui';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useState } from 'react';

interface LocationFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue?: UseFormSetValue<any>;
}

export function LocationField({ field, register, errors, setValue }: LocationFieldProps) {
  const error = errors[field.id]?.message as string;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        
        if (setValue) {
          setValue(field.id, loc);
        }
        
        setLoading(false);
        console.log('Location captured:', loc);
      },
      (error) => {
        setLocationError(error.message);
        setLoading(false);
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationError('');
    if (setValue) {
      setValue(field.id, null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {location ? (
        <div className="border rounded-lg p-4 bg-primary/5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-sm">Location Captured</span>
            </div>
            <button
              type="button"
              onClick={clearLocation}
              className="text-red-500 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latitude:</span>
              <span className="font-mono">{location.lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Longitude:</span>
              <span className="font-mono">{location.lng.toFixed(6)}</span>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            View on Google Maps →
          </a>
        </div>
      ) : (
        <Button
          type="button"
          onClick={captureLocation}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Getting location...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Current Location
            </>
          )}
        </Button>
      )}

      {locationError && (
        <p className="text-sm text-destructive">{locationError}</p>
      )}

      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

