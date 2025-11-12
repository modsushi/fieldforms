# Map Feature Setup Guide

This guide explains how to configure and use the map features in FieldForms.

## Prerequisites

### 1. Mapbox Access Token

You need a Mapbox access token to use the map features.

1. Go to [Mapbox](https://www.mapbox.com/) and create a free account
2. Navigate to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
3. Copy your default public token (starts with `pk.`)
4. Add it to your `.env` file:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_token_here"
```

### 2. Entity Geometry Data

For entities to appear on the map, they need geometry data. The geometry field should contain:

- **GeoJSON Point format** for precise locations:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

Example: San Francisco
```json
{
  "type": "Point",
  "coordinates": [-122.4194, 37.7749]
}
```

## Features Implemented

### ✅ Phase 1: Core Map Infrastructure (Completed)

1. **Base Mapbox Component** (`MapboxMap.tsx`)
   - Responsive map with controls
   - Theme-aware styling (light/dark mode)
   - Navigation controls, geolocation, scale
   - Loading and error states

2. **Geometry Utilities** (`geometry-utils.ts`)
   - WKT ↔ GeoJSON conversion
   - Distance calculations (Haversine)
   - Bearing calculations
   - Bounding box utilities
   - Point-in-polygon checks

3. **Entity Markers** (`EntityMarkers.tsx`)
   - Render entities on map with custom icons and colors
   - Automatic marker clustering for performance (100+ entities)
   - Hover popups with entity details
   - Click handling for entity selection
   - Selection highlighting

4. **Entity Map View** (`EntityMapView.tsx`)
   - Full-featured map display with entity filtering
   - Search and type filtering
   - Auto-fit bounds to show all entities
   - Entity click/selection support
   - Loading states

5. **Entities Page Enhancement**
   - **Map/Grid View Toggle** in header
   - Switch between card grid and interactive map
   - All filters work in both views
   - Maintains search and type filters

6. **Custom Hooks** (`use-mapbox.ts`)
   - Map state management
   - Marker lifecycle management
   - Pan/zoom utilities
   - Layer/source management

## Usage Examples

### Basic Map Display

```tsx
import { MapboxMap } from '@/components/map';

function MyComponent() {
  return (
    <MapboxMap
      initialCenter={[-122.4194, 37.7749]}
      initialZoom={12}
      height="500px"
      showControls
      showGeolocate
    />
  );
}
```

### Entity Map with Clustering

```tsx
import { EntityMapView } from '@/components/map';

function EntitiesMap() {
  const { data } = trpc.entities.getAll.useQuery({});

  return (
    <EntityMapView
      entities={data?.items || []}
      enableClustering={true}
      onEntityClick={(entity) => console.log('Clicked:', entity)}
    />
  );
}
```

### Using Map Hook

```tsx
import { useMapbox } from '@/hooks/use-mapbox';
import { MapboxMap } from '@/components/map';

function CustomMap() {
  const { setMap, addMarker, flyTo } = useMapbox({
    onMarkerClick: (id) => console.log('Marker clicked:', id),
  });

  const handleAddMarker = () => {
    addMarker({
      id: 'marker-1',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      popup: '<h3>San Francisco</h3>',
      color: '#3b82f6',
    });
  };

  return (
    <>
      <MapboxMap onLoad={setMap} />
      <button onClick={handleAddMarker}>Add Marker</button>
    </>
  );
}
```

## Map Styles

Available map styles (automatically theme-aware):
- `streets` - Default streets (switches to dark mode)
- `satellite` - Satellite imagery with street overlay
- `outdoors` - Outdoor/hiking focused
- `light` - Light themed
- `dark` - Dark themed

## Entity Types and Icons

Entities are displayed with type-specific colors and icons:

| Type | Icon | Color |
|------|------|-------|
| site | 📍 | Green (#10b981) |
| asset | 📦 | Blue (#3b82f6) |
| equipment | 🔧 | Orange (#f59e0b) |
| location | 📌 | Purple (#8b5cf6) |
| vehicle | 🚗 | Red (#ef4444) |

## Next Steps (Not Yet Implemented)

### Phase 2: Map-Based Work Order Creation
- Entity selection on map (click, draw polygon, radius)
- Create work orders from map selection
- Spatial query backend (find entities within radius/polygon)

### Phase 3: Location Marker Workflow
- Drop pins on map during work order execution
- Form submission per marker
- Marker collection management
- GeoJSON export

### Phase 4: Offline Support
- Service worker setup
- Map tile caching for offline use
- Photo upload queue
- Background sync

## Troubleshooting

### Map not loading
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env`
- Verify the token is a public token (starts with `pk.`)
- Check browser console for errors
- Ensure you have internet connectivity

### Entities not showing on map
- Verify entities have `geometry` field with valid GeoJSON
- Check that coordinates are in [longitude, latitude] order
- Ensure entities are not filtered out by search/type filter

### Clustering not working
- Clustering is automatic for 3+ markers
- Zoom in to see individual markers
- Set `enableClustering={false}` to disable

### Map not fitting all entities
- This happens automatically on load
- Call `fitCoordinates()` manually if needed
- Check that all entities have valid geometry

## Performance Tips

1. **Clustering**: Always enabled by default for 3+ entities
2. **Lazy Loading**: Map only loads when component mounts
3. **Memoization**: Entity filtering is memoized
4. **Debounced Search**: Consider adding debounce to search input

## API Reference

See individual component files for full prop documentation:
- `/components/map/MapboxMap.tsx`
- `/components/map/EntityMarkers.tsx`
- `/components/map/EntityMapView.tsx`
- `/hooks/use-mapbox.ts`
- `/lib/geo/geometry-utils.ts`
