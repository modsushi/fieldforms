# Entity System - Quick Start Guide

## 5-Minute Setup

### Step 1: Create Your First Entity with Location (2 min)

1. **Go to:** `/dashboard/entities`

2. **Click:** "Create Entity" button

3. **Fill in:**
   - Name: "Main Office"
   - Type: Site

4. **Add Location:**
   - Click "Select on Map"
   - Click on your location
   - Click "Confirm Location"

5. **Click:** "Create Entity"

✅ **Result:** Entity created with location data

### Step 2: View Entity on Map (30 seconds)

1. **On Entities Page:** Click the Map/Grid toggle (🗺️ icon)

2. **See:** Your entity as a marker on the map

3. **Click marker:** View entity details popup

✅ **Result:** Visual confirmation entity has location

### Step 3: Create Form with Entity Selector (2 minutes)

1. **Go to:** `/dashboard/forms` (or form builder)

2. **Create New Form Template**

3. **Add Field:**
   - Type: **Entity Selector** 🏢
   - Label: "Select Location"
   - Entity Type Filter: "site" (optional)

4. **Save Form Template**

✅ **Result:** Form that can reference entities

### Step 4: Fill Form with Entity Selection (30 seconds)

1. **Open the form** (in work order or standalone)

2. **See "Select Location" field** with search box

3. **Type or Click:** Search opens dropdown

4. **Select:** "Main Office" from list

5. **Submit Form**

✅ **Result:** Form submission linked to entity

---

## Common Use Cases

### Use Case 1: Daily Site Inspections

**Setup:**
1. Create site entities with locations
2. Create "Daily Inspection" form with entity_selector
3. Create workflow with iterator over sites

**Usage:**
- Operator gets work order
- For each site: Fill inspection form
- Entity automatically linked

### Use Case 2: Equipment Maintenance

**Setup:**
1. Create equipment entities (pumps, generators, etc.)
2. Add locations to each equipment
3. Create "Maintenance Log" form with entity_selector

**Usage:**
- Operator selects equipment from dropdown
- Fills maintenance details
- History tracked per equipment

### Use Case 3: Map-Based Work Assignment

**Setup:**
1. Create multiple site entities with locations
2. Supervisor uses map view

**Usage:**
- Go to `/dashboard/work-orders/map`
- Draw polygon around area
- All entities in area selected
- Create work order for those entities

---

## Key Features

### GeometryInput Component

**Two input modes:**
1. **Map Click** - Visual, intuitive
2. **Manual Entry** - Precise, for known coordinates

**Displays:**
- Current location with coordinates
- Mini preview on map
- Clear/change actions

### EntitySelectorField

**Features:**
- **Search** - By name, code, or type
- **Filter** - By entity type
- **Icons** - Visual entity type indicators
- **Real-time** - Updates as you type

**States:**
- Empty: Shows search box
- Searching: Shows filtered results
- Selected: Shows entity details

---

## File Locations

### Components
- **GeometryInput:** `apps/web/src/components/entities/GeometryInput.tsx`
- **EntitySelectorField:** `apps/web/src/components/form-fields/entity-selector-field.tsx`

### Enhanced Pages
- **Entity Management:** `apps/web/src/app/dashboard/entities/page.tsx`
- **Form Builder Config:** `apps/web/src/components/form-builder/field-types-config.ts`

### Documentation
- **Complete Guide:** `ENTITY-SYSTEM-COMPLETE.md`
- **Phase 2 Features:** `PHASE-2-MAP-WORK-ORDERS.md`

---

## Troubleshooting

### Map Not Loading
**Problem:** "Mapbox token not configured" error

**Solution:**
1. Check `.env` file
2. Verify `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx...`
3. Token is hardcoded in MapboxMap.tsx (temporary)

### Entities Not Showing on Map
**Problem:** No markers visible

**Solution:**
1. Check entities have geometry data
2. Format should be: `POINT(lng lat)` (WKT)
3. Try Entity Map View toggle on entities page

### Entity Selector Empty
**Problem:** Dropdown shows "No entities available"

**Solution:**
1. Create entities first
2. Check entity type filter matches
3. Verify entities are isActive: true

### Cannot Create Entity
**Problem:** Create button disabled or error

**Solution:**
1. Name field is required
2. Location is optional (can skip)
3. Check console for validation errors

---

## Next Steps

### After Basic Setup

1. **Add More Entities**
   - Create sites, assets, equipment
   - Add locations to all
   - Use tags for organization

2. **Build Forms**
   - Add entity_selector fields
   - Create inspection checklists
   - Link forms to entities

3. **Create Workflows**
   - Use iterator step for multi-entity work
   - Map-based work order creation
   - Track entity history via submissions

4. **Use Spatial Features** (Phase 2)
   - Find entities within radius
   - Select entities by drawing polygon
   - Route optimization

### Advanced Features

- **Phase 3: Location Markers**
  - Drop pins during work orders
  - Survey mode with multiple markers
  - GeoJSON export

- **Future: Entity Lifecycle**
  - Status tracking (active/maintenance/retired)
  - Change history
  - Automated workflows on status change

---

## Quick Reference

### Entity Types
- `site` - Physical locations, buildings, areas
- `asset` - Valuable items, infrastructure
- `equipment` - Machinery, tools, devices
- `location` - Points of interest, markers
- `other` - Custom types

### Geometry Format (WKT)
```
POINT(-122.4194 37.7749)
```
- First number: Longitude (-180 to 180)
- Second number: Latitude (-90 to 90)

### Form Field Configuration
```typescript
{
  type: 'entity_selector',
  label: 'Select Entity',
  options: {
    source: 'entity',
    value: {
      entityType: 'site',  // Filter by type
      tags: ['inspected']  // Filter by tags
    }
  }
}
```

---

## Support

### Documentation
- `ENTITY-SYSTEM-COMPLETE.md` - Full implementation guide
- `MAP_SETUP.md` - Phase 1 map features
- `PHASE-2-MAP-WORK-ORDERS.md` - Spatial queries

### Questions?
Check the comprehensive guides above for:
- Detailed explanations
- Code examples
- Architecture overview
- API reference
- Troubleshooting

---

**You're Ready!** 🎉

Start by creating a few entities with locations, then build forms that reference them. The system is flexible and supports many field operations workflows.
