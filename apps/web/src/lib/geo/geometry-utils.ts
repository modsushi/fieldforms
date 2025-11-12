/**
 * Geometry utility functions for converting between WKT, GeoJSON, and handling spatial operations
 */

import type { Feature, Point, Polygon, GeoJsonProperties } from 'geojson';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * Convert WKT Point string to GeoJSON Point
 * Example: "POINT(-122.4194 37.7749)" -> { type: "Point", coordinates: [-122.4194, 37.7749] }
 */
export function wktPointToGeoJSON(wkt: string): Point {
  const match = wkt.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
  if (!match) {
    throw new Error(`Invalid WKT Point format: ${wkt}`);
  }

  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);

  return {
    type: 'Point',
    coordinates: [lng, lat],
  };
}

/**
 * Convert WKT Polygon string to GeoJSON Polygon
 * Example: "POLYGON((lng lat, lng lat, ...))" -> GeoJSON Polygon
 */
export function wktPolygonToGeoJSON(wkt: string): Polygon {
  const match = wkt.match(/POLYGON\s*\(\((.*?)\)\)/i);
  if (!match) {
    throw new Error(`Invalid WKT Polygon format: ${wkt}`);
  }

  const coordsString = match[1];
  const coordinates = coordsString
    .split(',')
    .map(pair => {
      const [lng, lat] = pair.trim().split(/\s+/).map(parseFloat);
      return [lng, lat];
    });

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

/**
 * Convert any WKT geometry to GeoJSON
 */
export function wktToGeoJSON(wkt: string): Point | Polygon {
  if (wkt.toUpperCase().startsWith('POINT')) {
    return wktPointToGeoJSON(wkt);
  } else if (wkt.toUpperCase().startsWith('POLYGON')) {
    return wktPolygonToGeoJSON(wkt);
  }
  throw new Error(`Unsupported WKT geometry type: ${wkt}`);
}

/**
 * Convert GeoJSON Point to WKT
 */
export function geoJSONPointToWKT(point: Point): string {
  const [lng, lat] = point.coordinates;
  return `POINT(${lng} ${lat})`;
}

/**
 * Convert GeoJSON Polygon to WKT
 */
export function geoJSONPolygonToWKT(polygon: Polygon): string {
  const coords = polygon.coordinates[0]
    .map(([lng, lat]) => `${lng} ${lat}`)
    .join(', ');
  return `POLYGON((${coords}))`;
}

/**
 * Convert GeoJSON geometry to WKT
 */
export function geoJSONToWKT(geometry: Point | Polygon): string {
  if (geometry.type === 'Point') {
    return geoJSONPointToWKT(geometry);
  } else if (geometry.type === 'Polygon') {
    return geoJSONPolygonToWKT(geometry);
  }
  throw new Error(`Unsupported GeoJSON geometry type: ${geometry.type}`);
}

/**
 * Convert Coordinates object to GeoJSON Point
 */
export function coordinatesToGeoJSON(coords: Coordinates): Point {
  return {
    type: 'Point',
    coordinates: [coords.lng, coords.lat],
  };
}

/**
 * Convert Coordinates object to WKT Point
 */
export function coordinatesToWKT(coords: Coordinates): string {
  return `POINT(${coords.lng} ${coords.lat})`;
}

/**
 * Convert GeoJSON Point to Coordinates object
 */
export function geoJSONToCoordinates(point: Point): Coordinates {
  const [lng, lat] = point.coordinates;
  return { lat, lng };
}

/**
 * Convert WKT Point to Coordinates object
 */
export function wktToCoordinates(wkt: string): Coordinates {
  const point = wktPointToGeoJSON(wkt);
  return geoJSONToCoordinates(point);
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate bearing between two coordinates in degrees
 */
export function calculateBearing(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const dLng = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate bounding box from an array of coordinates
 */
export function calculateBoundingBox(coordinates: Coordinates[]): BoundingBox {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box from empty coordinates');
  }

  const lngs = coordinates.map(c => c.lng);
  const lats = coordinates.map(c => c.lat);

  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  };
}

/**
 * Get center point of a bounding box
 */
export function getBoundingBoxCenter(bbox: BoundingBox): Coordinates {
  return {
    lng: (bbox.minLng + bbox.maxLng) / 2,
    lat: (bbox.minLat + bbox.maxLat) / 2,
  };
}

/**
 * Validate coordinates are valid latitude and longitude
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  coords: Coordinates,
  precision: number = 6
): string {
  return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
}

/**
 * Check if a point is inside a polygon (simple ray casting algorithm)
 */
export function isPointInPolygon(
  point: Coordinates,
  polygon: Coordinates[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Create a GeoJSON Feature from coordinates and properties
 */
export function createGeoJSONFeature(
  coords: Coordinates,
  properties: GeoJsonProperties = {}
): Feature<Point> {
  return {
    type: 'Feature',
    geometry: coordinatesToGeoJSON(coords),
    properties,
  };
}

// Helper functions
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
