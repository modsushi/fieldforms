# Entity System Enhancement - Complete Implementation

## Overview

Successfully implemented **Phase A (Location Input) + Phase B (Entity Selector Field)** to create a complete, flexible entity management system for FieldForms.

---

## ✅ What's Been Implemented

### Phase A: Location Input for Entities

#### 1. **GeometryInput Component**
**File:** `apps/web/src/components/entities/GeometryInput.tsx`

**Features:**
- ✅ Interactive map picker - click to place location
- ✅ Manual coordinate entry (lat/lng input fields)
- ✅ Current location display with coordinates
- ✅ Clear/reset functionality
- ✅ Map preview when location is set
- ✅ Validation (lat: -90 to 90, lng: -180 to 180)
- ✅ WKT format handling (stored in database)
- ✅ Responsive design with loading states

**Usage:**
```tsx
<GeometryInput
  value={wktString}  // "POINT(-122.4194 37.7749)"
  onChange={(wkt) => setGeometry(wkt)}
  label="Location"
  helperText="Click on map or enter coordinates"
  required={false}
/>
```

#### 2. **Enhanced Entity Creation Form**
**File:** `apps/web/src/app/dashboard/entities/page.tsx` (CreateEntityForm)

**Changes:**
- ✅ Added GeometryInput component to create modal
- ✅ Geometry stored in WKT format
- ✅ Optional location field (not required)
- ✅ Full map interaction in creation flow

**Before:**
```typescript
// Only: Name, Type
{
  name: string;
  entityType: string;
}
```

**Now:**
```typescript
{
  name: string;
  entityType: string;
  geometry: string | null;  // WKT Point
}
```

#### 3. **Enhanced Entity Edit Form**
**File:** `apps/web/src/app/dashboard/entities/page.tsx` (EditEntityForm)

**Changes:**
- ✅ GeometryInput shows current location on map
- ✅ Can update/change location
- ✅ Can clear location
- ✅ Preserves existing geometry when editing other fields

---

### Phase B: Entity Selector Field Type

#### 1. **Entity Selector Field Type**
**File:** `apps/web/src/components/form-builder/field-types-config.ts`

**New Field Type:**
```typescript
{
  type: 'entity_selector',
  label: 'Entity Selector',
  icon: '🏢',
  description: 'Select an entity (site, asset, equipment)',
  defaultConfig: {
    type: 'entity_selector',
    label: 'Select Entity',
    required: false,
    options: {
      source: 'entity',
      value: {
        entityType: null,  // null = all types, or 'site', 'asset', etc.
        tags: [],           // optional filter by tags
      },
    },
  },
}
```

**Configuration Options:**
- `entityType`: Filter by entity type ('site', 'asset', 'equipment', 'location')
- `tags`: Filter by entity tags

#### 2. **EntitySelectorField Component**
**File:** `apps/web/src/components/form-fields/entity-selector-field.tsx`

**Features:**
- ✅ Searchable dropdown (search by name, code, or type)
- ✅ Real-time filtering as you type
- ✅ Entity type icons (site 📍, asset 📦, equipment 🔧)
- ✅ Selected entity display with details
- ✅ Change/Clear actions
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Entity type filtering
- ✅ Tag filtering
- ✅ Responsive dropdown with scroll

**UI Flow:**
1. User clicks/types in search field
2. Dropdown shows filtered entities
3. Click entity to select
4. Selected entity displayed with icon and details
5. "Change" to reopen dropdown
6. "Clear" to remove selection

#### 3. **EntitySelectorControlled Component**
**File:** `apps/web/src/components/form-fields/entity-selector-controlled.tsx`

**Purpose:**
- Wrapper to integrate EntitySelectorField with react-hook-form
- Handles form registration
- Manages validation
- Syncs with form state

#### 4. **Form Renderer Integration**
**Files:**
- `apps/web/src/components/form-renderer/field-renderer.tsx`
- `apps/web/src/components/form-renderer/form-renderer.tsx`

**Changes:**
- ✅ Added `entity_selector` case to field renderer
- ✅ Added `setValue` prop to FieldRenderer
- ✅ Passes `setValue` from useForm to FieldRenderer
- ✅ Full react-hook-form integration

---

## 🎯 How to Use

### Creating an Entity with Location

1. **Navigate to Entities Page:**
   ```
   /dashboard/entities
   ```

2. **Click "Create Entity"**

3. **Fill in Entity Details:**
   - Name: "Downtown Office"
   - Type: Site
   - Location: Click "Select on Map"

4. **Set Location:**
   - **Option A: Map Click**
     - Click on map where entity is located
     - Location captured automatically

   - **Option B: Manual Entry**
     - Click "Enter Coordinates"
     - Enter Latitude: 37.7749
     - Enter Longitude: -122.4194
     - Click "Set Location"

5. **Submit:** Entity created with geometry data

### Editing Entity Location

1. **Click "Edit" on any entity card**

2. **Update Location:**
   - Current location shows on map
   - Click "Change Location" → "Select on Map"
   - Click new location or enter new coordinates
   - Click "Confirm Location"

3. **Save Changes**

### Using Entity Selector in Forms

#### Step 1: Create Form Template with Entity Selector

**In Form Builder:**

1. **Add Field** → **Entity Selector** 🏢

2. **Configure Field:**
   ```typescript
   {
     label: "Which site did you visit?",
     required: true,
     options: {
       source: "entity",
       value: {
         entityType: "site",  // Only show sites
         tags: []             // Optional: filter by tags
       }
     }
   }
   ```

3. **Save Form Template**

#### Step 2: Fill Form with Entity Selection

**When operator fills form:**

1. **Field displays:** "Which site did you visit?"

2. **Search Box:** Type to search sites
   - Searches: name, code, entity type
   - Updates results in real-time

3. **Select Entity:** Click entity from dropdown

4. **Selected Display:** Shows site name, type, and code

5. **Submit Form:** Entity ID stored in submission data

#### Step 3: View Submission with Entity Link

**Form submission data:**
```json
{
  "site_field_id": "uuid-of-selected-entity",
  // ... other fields
}
```

**Future Enhancement:** Display entity name (not just ID) in submission view

---

## 📊 Entity Usage Patterns

### Pattern 1: Site Inspection Form

**Form Template:**
```typescript
{
  sections: [{
    fields: [
      {
        type: 'entity_selector',
        label: 'Select Site',
        options: {
          source: 'entity',
          value: { entityType: 'site' }
        }
      },
      {
        type: 'checkbox',
        label: 'Safety equipment present?'
      },
      {
        type: 'photo',
        label: 'Take site photo'
      },
      {
        type: 'textarea',
        label: 'Additional notes'
      }
    ]
  }]
}
```

**Use Case:**
- Operator visits site
- Selects site from dropdown
- Completes inspection checklist
- Submission linked to specific site

### Pattern 2: Equipment Maintenance Form

**Form Template:**
```typescript
{
  sections: [{
    fields: [
      {
        type: 'entity_selector',
        label: 'Equipment ID',
        options: {
          source: 'entity',
          value: { entityType: 'equipment' }
        }
      },
      {
        type: 'select',
        label: 'Maintenance Type',
        options: {
          source: 'static',
          value: [
            { label: 'Routine', value: 'routine' },
            { label: 'Repair', value: 'repair' },
            { label: 'Emergency', value: 'emergency' }
          ]
        }
      },
      {
        type: 'textarea',
        label: 'Work performed'
      }
    ]
  }]
}
```

### Pattern 3: Multi-Entity Iterator Workflow

**Workflow Definition:**
```typescript
{
  name: "Multi-Site Inspection",
  steps: [
    // Step 1: Iterate over entities
    {
      type: "iterator",
      config: {
        sourceType: "entities",
        entityType: "site",
        entityIds: ["site1", "site2", "site3"],
        steps: [
          {
            type: "form",
            config: {
              formTemplateId: "inspection-form"
            }
          }
        ]
      }
    }
  ]
}
```

**How it works:**
1. Work order created for 3 sites
2. Workflow iterates: Site 1 → Form → Site 2 → Form → Site 3 → Form
3. Each form submission linked to its entity
4. Progress: "Site 2 of 3"

### Pattern 4: Map-Based Work Order Creation

**Flow:**
1. Supervisor goes to `/dashboard/work-orders/map`
2. Draws polygon around area or uses circle select
3. System selects all entities with geometry in area
4. Creates work order
5. Work order metadata stores entity IDs:
   ```json
   {
     "selectedEntityIds": ["id1", "id2", "id3"],
     "createdFromMap": true
   }
   ```

### Pattern 5: Entity Lifecycle Tracking

**Current Capabilities:**
```typescript
// Entity has:
{
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
  geometry: string  // Can change over time
}

// Track via FormSubmissions:
Entity.formSubmissions = [
  { formTemplateId: "installation", submittedAt: "2024-01-15" },
  { formTemplateId: "monthly-check", submittedAt: "2024-02-15" },
  { formTemplateId: "repair", submittedAt: "2024-03-01" }
]
```

**Pattern:**
- Entity represents physical asset
- Forms capture events/states
- Query: "Get all forms for Entity X"
- Result: Complete history of entity

---

## 🔧 Technical Details

### Data Flow

#### Entity Creation with Location

```
User Interface (GeometryInput)
  ↓ (clicks map at lat: 37.7749, lng: -122.4194)
Geometry Utils: coordinatesToWKT()
  ↓ converts to WKT
WKT String: "POINT(-122.4194 37.7749)"
  ↓ sent to API
tRPC entities.create mutation
  ↓ validates and stores
PostgreSQL entities table
  ↓ geometry column (VARCHAR)
Stored: "POINT(-122.4194 37.7749)"
```

#### Entity Selector in Form

```
Form Builder
  ↓ creates field config
{
  type: 'entity_selector',
  options: { value: { entityType: 'site' } }
}
  ↓ form template saved
Operator Opens Form
  ↓ renders EntitySelectorField
tRPC entities.getAll.useQuery({ entityType: 'site' })
  ↓ fetches filtered entities
Searchable Dropdown
  ↓ user selects entity
Entity ID: "uuid-abc-123"
  ↓ react-hook-form setValue
Form Submission Data
  ↓ stores entity ID
{
  "site_selector_field": "uuid-abc-123"
}
  ↓ saved to database
FormSubmission.data column (JSON)
```

### Database Schema

**Entity Table:**
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  entity_type VARCHAR(50),
  parent_id UUID,
  name VARCHAR(255),
  code VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  geometry VARCHAR,  -- WKT format: "POINT(lng lat)"
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index (Phase 2)
CREATE INDEX idx_entities_geometry_gist
ON entities USING GIST (ST_GeomFromText(geometry, 4326))
WHERE geometry IS NOT NULL;
```

**FormSubmission Relationship:**
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY,
  form_template_id UUID,
  entity_id UUID,  -- Optional link to entity
  data JSONB,      -- Stores entity_selector field values
  location VARCHAR,
  submitted_by UUID,
  submitted_at TIMESTAMP
);
```

### Geometry Format

**Storage (WKT):**
```
POINT(-122.4194 37.7749)
```

**Display (GeoJSON):**
```json
{
  "type": "Point",
  "coordinates": [-122.4194, 37.7749]
}
```

**Conversion Functions:**
- `coordinatesToWKT({ lat, lng })` → WKT string
- `wktToCoordinates(wkt)` → { lat, lng }
- `wktToGeoJSON(wkt)` → GeoJSON Point
- `geoJSONToWKT(geojson)` → WKT string

---

## 🎨 UI/UX Highlights

### GeometryInput Component

**States:**

1. **No Location Set:**
   ```
   [Select on Map] [Enter Coordinates]
   ```

2. **Location Set:**
   ```
   📍 37.774900, -122.419400
   Latitude: 37.774900, Longitude: -122.419400
   [Change Location] [×]
   ```

3. **Map Open:**
   ```
   [  Interactive Mapbox Map  ]
   Click on the map to set location
   [Close Map] [Confirm Location]
   ```

4. **Manual Entry:**
   ```
   Latitude *    Longitude *
   [37.7749]     [-122.4194]
   -90 to 90     -180 to 180
   [Cancel] [Set Location]
   ```

### EntitySelectorField Component

**States:**

1. **No Selection:**
   ```
   Select Entity
   [🔍 Search entities...]
   ```

2. **Dropdown Open:**
   ```
   [🔍 downtown]

   📍 Downtown Office
      site • DO-001

   📍 Downtown Warehouse
      site • DW-002

   [Cancel]
   ```

3. **Entity Selected:**
   ```
   📍 Downtown Office
      site • DO-001
   [Change] [×]
   ```

---

## 🧪 Testing Checklist

### Phase A: Location Input

- [ ] Create entity with map click
- [ ] Create entity with manual coordinates
- [ ] Edit entity location
- [ ] Clear entity location
- [ ] View entity on map (entities page map view)
- [ ] Entity without location (should work)
- [ ] Invalid coordinates rejected (lat > 90, lng > 180)
- [ ] Map loads correctly with Mapbox token
- [ ] Location persists after page reload

### Phase B: Entity Selector

- [ ] Add entity_selector field in form builder
- [ ] Configure entity type filter
- [ ] Fill form with entity selection
- [ ] Search entities by name
- [ ] Search entities by code
- [ ] Select entity from dropdown
- [ ] Change selected entity
- [ ] Clear selected entity
- [ ] Required validation works
- [ ] Form submission stores entity ID
- [ ] View submission shows entity ID

### Integration Tests

- [ ] Create entity → View on map → Verify location
- [ ] Create form with entity_selector → Fill form → Submit → Verify data
- [ ] Map work order creation → Select entities → Create → Verify metadata
- [ ] Iterator workflow → Entities with geometry → Execute → Verify context

---

## 📚 API Reference

### Entity Creation/Update

**Create Entity:**
```typescript
trpc.entities.create.useMutation({
  name: string,
  entityType: string,
  geometry?: string,  // WKT format
  code?: string,
  parentId?: string,
  metadata?: Record<string, any>,
  tags?: string[]
})
```

**Update Entity:**
```typescript
trpc.entities.update.useMutation({
  id: string,
  name?: string,
  geometry?: string,  // WKT format
  code?: string,
  metadata?: Record<string, any>,
  tags?: string[],
  isActive?: boolean
})
```

### Entity Queries

**Get All Entities:**
```typescript
trpc.entities.getAll.useQuery({
  entityType?: string,
  tags?: string[],
  parentId?: string,
  limit?: number,
  offset?: number
})
```

**Spatial Queries (Phase 2):**
```typescript
trpc.entities.withinRadius.useQuery({
  center: { lat: number, lng: number },
  radiusKm: number,
  entityType?: string
})

trpc.entities.withinPolygon.useQuery({
  polygon: Array<{ lat: number, lng: number }>,
  entityType?: string
})
```

---

## 🔮 What's Next?

### Completed
✅ Location input for entities (map + manual)
✅ Entity selector field type for forms
✅ Form-entity linking via entity_selector
✅ Searchable entity dropdown with filters

### Not Implemented (Future)
❌ Entity status/lifecycle tracking
❌ Entity change history/audit trail
❌ Display entity name (not ID) in form submissions
❌ Entity relationship UI
❌ Bulk entity import/export
❌ Entity templates

### Phase 3: Location Marker Workflows
- Drop pins during work order execution
- Form per marker (survey mode)
- Marker collections
- GeoJSON export

---

## 🎓 Examples & Recipes

### Example 1: Water Quality Sampling

**Entities:**
- Type: `site`
- Locations: Various sampling points
- Tags: `water-quality`, `monthly-sampling`

**Form Template:**
```typescript
{
  sections: [{
    fields: [
      {
        type: 'entity_selector',
        label: 'Sampling Location',
        options: {
          source: 'entity',
          value: {
            entityType: 'site',
            tags: ['water-quality']
          }
        }
      },
      {
        type: 'number',
        label: 'pH Level',
        validation: [
          { type: 'min', value: 0 },
          { type: 'max', value: 14 }
        ]
      },
      {
        type: 'number',
        label: 'Temperature (°C)'
      },
      {
        type: 'photo',
        label: 'Sample Photo'
      }
    ]
  }]
}
```

**Workflow:**
```typescript
{
  steps: [
    {
      type: 'iterator',
      config: {
        sourceType: 'entities',
        entityQuery: {
          tags: ['water-quality']
        },
        steps: [
          {
            type: 'form',
            config: { formTemplateId: 'sampling-form' }
          }
        ]
      }
    }
  ]
}
```

### Example 2: Infrastructure Inspection

**Entities:**
```
City Infrastructure
  ├─ Bridge A (type: asset, geometry: POINT(...))
  ├─ Bridge B (type: asset, geometry: POINT(...))
  ├─ Road Section 1 (type: asset, geometry: POLYGON(...))
  └─ Traffic Light 1 (type: equipment, geometry: POINT(...))
```

**Form:**
- Entity Selector: "Select Infrastructure"
- Condition Assessment: Good/Fair/Poor
- Defects Found: (multi-checkbox)
- Photos: (photo field)
- Repair Needed: Yes/No

**Report:**
- Query: All inspections for Bridge A
- Result: History of condition over time
- Visualization: Status timeline

---

## 📝 Summary

Successfully implemented a complete entity management system with:

### Phase A Deliverables
✅ **GeometryInput Component** - Interactive map + manual entry
✅ **Entity Create Form** - Location picker integrated
✅ **Entity Edit Form** - Update location on map
✅ **WKT Geometry Handling** - Proper format conversion

### Phase B Deliverables
✅ **Entity Selector Field Type** - New form field type
✅ **EntitySelectorField Component** - Searchable dropdown
✅ **Form Renderer Integration** - react-hook-form compatible
✅ **Type Filtering** - Filter entities by type/tags

### System Flexibility Achieved

**Entity → Form Relationship:**
- ✅ Forms can be about entities (entity_id link)
- ✅ Forms can select entities (entity_selector field)
- ✅ One entity → many forms (inspection history)
- ✅ Forms reference multiple entities (via multiple fields)

**Entity → Workflow Relationship:**
- ✅ Workflows iterate over entities
- ✅ Map-based entity selection for work orders
- ✅ Entity context in form submissions

**Entity Flexibility:**
- ✅ Hierarchical relationships (parent/child)
- ✅ Flexible metadata (JSON properties)
- ✅ Tag-based organization
- ✅ Type extensibility
- ✅ Location tracking (geometry field)

The system is now ready for real-world field operations with full geo-forms capabilities!
