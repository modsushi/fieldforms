Geo Forms Enhancement Plan (2-3 Week Foundation)

Overview

Transform FieldForms into a map-first field operations platform with focus on location marker workflows and map-based work order creation.

---

Phase 1: Core Map Infrastructure (Week 1)

1.1 Base Mapbox Components

Create: apps/web/src/components/map/MapboxMap.tsx

- Initialize Mapbox GL JS with access token configuration
- Responsive container with loading states
- Controls: zoom, navigation, geolocation
- Support both point and polygon geometries
- Dark/light mode themes

Create: apps/web/src/components/map/EntityMarker.tsx

- Render entities as map markers with custom icons
- Marker clustering for performance (100+ entities)
- Popup with entity details on click
- Color coding by entity type (site/asset/equipment)

Create: apps/web/src/lib/geo/geometry-utils.ts

- WKT ↔ GeoJSON conversion helpers
- Coordinate validation
- Bounding box calculations
- Distance/bearing calculations

Create: apps/web/src/hooks/use-mapbox.ts

- Map instance management hook
- Marker state handling
- Map event listeners

  1.2 Entity Map View

Enhance: apps/web/src/app/dashboard/entities/page.tsx

- Add "Map View" / "Grid View" toggle
- Full-screen map displaying all entities
- Click marker → show entity details panel
- Filter entities on map by type/tags
- "Add Entity" from map click

Create: apps/web/src/components/entities/EntityMapView.tsx

- Dedicated map component for entity management
- Selection state for bulk operations
- Boundary display for parent entities

  1.3 Location Input Enhancement

Enhance: apps/web/src/components/form-fields/location-field.tsx

- Add mini-map preview (300x200px) showing captured location
- Manual pin placement option
- Show accuracy radius
- Display address via reverse geocoding (Mapbox Geocoding API)

---

Phase 2: Map-Based Work Order Creation (Week 2)

2.1 Work Order Map Interface

Create: apps/web/src/app/dashboard/work-orders/map/page.tsx

- New route: /dashboard/work-orders/map
- Full-screen map with entity markers
- Entity selection modes:
  - Click to select individual entities
  - Draw polygon to select all within area
  - Draw circle for radius selection
- Selected entities highlight in different color
- "Create Work Order from Selection" button

Create: apps/web/src/components/work-orders/EntitySelector.tsx

- Map-based multi-select component
- Drawing tools (polygon, circle, rectangle)
- Selected entity list sidebar
- Quick filters (by type, distance from point)

Enhance: apps/web/src/app/dashboard/work-orders/new/page.tsx

- Add "Select from Map" button
- Opens entity selector modal
- Pre-populates iterator step with selected entities

  2.2 Spatial Query Backend

Create: apps/web/src/lib/geo/spatial-queries.ts

- PostGIS query helpers using raw SQL
- findEntitiesWithinRadius(lat, lng, radiusKm)
- findEntitiesWithinPolygon(polygon)
- calculateDistance(entity1, entity2)
- Add spatial indexes to schema

Enhance: apps/web/src/server/api/routers/entities.ts

- New procedures:
  - entities.withinRadius - find nearby entities
  - entities.withinBounds - entities in bounding box
  - entities.withinPolygon - entities inside polygon

---

Phase 3: Location Marker Workflow Step (Week 2-3)

3.1 Location Marker Step Component

Create: apps/web/src/components/workflow/steps/LocationMarkerStep.tsx

- Full-screen map interface
- Tap/click to drop marker pins
- Marker counter: "3 of 5-10 markers placed"
- Each marker opens form modal
- Marker list sidebar with completion status
- "Complete Step" when min markers met
- Delete/edit marker functionality

Create: apps/web/src/components/workflow/steps/MarkerFormModal.tsx

- Full-screen modal for marker form
- Shows marker number and coordinates
- Form submission linked to marker
- Photo capture auto-tagged with marker location
- Save and continue to next marker

Create: apps/web/src/lib/workflow/location-marker-engine.ts

- Marker state management
- Form submission linking
- Progress calculation
- Validation (min/max markers, allowed area)

  3.2 Backend Support

Enhance: apps/web/src/server/api/routers/work-orders.ts

- New procedures:
  - workOrders.createMarker - save marker with form
  - workOrders.getMarkers - list markers for work order
  - workOrders.deleteMarker
  - workOrders.exportMarkersGeoJSON

Enhance: Marker model usage in workflow execution

- Link markers to work order steps
- Associate form submissions with markers
- Store marker properties (type, description)

  3.3 Workflow Builder Updates

Enhance: apps/web/src/app/dashboard/workflows/[id]/edit/page.tsx (if exists)

- Add Location Marker step configuration UI
- Map preview for allowed area
- Min/max marker settings
- Form template selector
- Marker type dropdown

---

Phase 4: Offline Map Support (Week 3)

4.1 Service Worker for PWA

Create: apps/web/public/sw.js

- Cache app shell (HTML, CSS, JS)
- Network-first strategy for API
- Cache-first for static assets
- Offline fallback page

Create: apps/web/src/lib/pwa/register-sw.ts

- Service worker registration
- Update detection
- Prompt for reload

Enhance: apps/web/next.config.js

- Configure PWA with next-pwa plugin
- Generate manifest.json
- App icons and splash screens

  4.2 Offline Map Tiles

Create: apps/web/src/lib/geo/offline-maps.ts

- Map tile caching strategy
- IndexedDB for tile storage (Dexie table)
- Download manager for map regions
- Tile expiry and cleanup

Create: apps/web/src/components/map/OfflineMapDownloader.tsx

- UI to select and download map areas
- Progress indicator
- Estimated storage size
- Manage downloaded areas

Enhance: MapboxMap component

- Detect online/offline state
- Switch to cached tiles when offline
- Show indicator for offline mode

  4.3 Offline Photo Upload Queue

Enhance: apps/web/src/lib/offline/OfflineManager.ts

- Implement file upload queue (marked TODO)
- Store photos as base64 in IndexedDB
- Upload to S3 when online
- Retry logic with progress

Create: apps/web/src/lib/offline/photo-sync.ts

- Photo compression before storage
- Thumbnail generation
- EXIF data extraction
- Upload progress tracking

---

Phase 5: Polish & UX (Week 3)

5.1 Map Navigation for Operators

Enhance: apps/web/src/app/operator/work-order/[id]/page.tsx

- Show work order entities on map
- "Navigate to Entity" button (opens external maps app)
- Progress map: completed vs pending entities
- Breadcrumb trail (if tracking enabled)

Create: apps/web/src/components/map/WorkOrderMap.tsx

- Simplified map for operators
- Current location indicator
- Entity markers with completion status
- Distance to next entity

  5.2 Geometry Input for Entities

Create: apps/web/src/components/entities/GeometryInput.tsx

- Map-based location picker
- Point placement mode (drag marker)
- Polygon drawing mode (for sites)
- Import from GeoJSON file
- Clear/reset geometry

Enhance: Entity create/edit forms

- Replace manual coordinate entry with GeometryInput
- Show entity on map during editing
- Validate geometry is within bounds

  5.3 Reports with Maps

Enhance: apps/web/src/lib/reports/pdf-generator.ts

- Embed static map images in PDFs (Mapbox Static API)
- Show entity locations
- Show marker collections with numbered pins
- Travel path if tracked

Create: apps/web/src/lib/reports/geojson-export.ts

- Export work order data as GeoJSON
- Include all entities, markers, submissions
- Properties include form data
- Compatible with QGIS, ArcGIS

---

Implementation Details

Environment Variables

Add to .env:
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx...
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12

Database Migrations

Add spatial indexes:
CREATE INDEX idx_entities_geometry ON entities USING GIST (ST_GeomFromText(geometry));
CREATE INDEX idx_markers_location ON markers USING GIST (ST_GeomFromText(location));

Add location to form_submissions:

- Already exists, ensure WKT format

Dependencies (Already Installed)

- ✅ mapbox-gl v3.1.2
- ✅ geojson package
- ✅ @turf/turf (spatial calculations)

New Dependencies Needed

- @mapbox/mapbox-gl-draw - drawing tools
- next-pwa - PWA support
- workbox-\* - service worker utilities

---

Success Metrics

By end of Week 3, users should be able to:

✅ View entities on an interactive map with clustering and popups✅ Create work orders by selecting entities on a map (click or draw area)✅ Execute location marker
workflows - drop pins, fill form per pin✅ Work offline - cache app, maps, sync when back online✅ Input entity locations visually via map picker✅ Download map regions
for offline field work✅ Export geo data as GeoJSON for GIS analysis

---

Future Enhancements (Beyond 3 Weeks)

- Real-time GPS tracking with breadcrumb trails
- Automatic photo geotagging from EXIF
- Route optimization for multi-entity work orders
- Geofencing (auto-complete step when entering area)
- Heat maps for aggregated data visualization
- Advanced spatial queries (nearest asset, within boundary)
- Turn-by-turn navigation integration
- Offline basemap pre-loading by region

---

This plan focuses on delivering high-value geo features quickly while building a solid foundation for future enhancements.
