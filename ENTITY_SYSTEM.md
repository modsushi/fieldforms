Entity System Enhancement Plan

Critical Issues Identified

Problem 1: No way to add geometry/coordinates when creating entities
Problem 2: No entity selector field type for forms
Problem 3: No entity status/lifecycle tracking

Proposed Solution - 3 Phases

Phase A: Location Input (CRITICAL)

Duration: ~1 hour

1.  Create GeometryInput component (components/entities/GeometryInput.tsx)

- Interactive map to click and place marker
- Manual lat/lng input fields as fallback
- Display current location on map
- Clear/reset functionality

2.  Enhance CreateEntityForm (entities/page.tsx)

- Add GeometryInput to create modal
- Add GeometryInput to edit modal
- Handle geometry data (GeoJSON → WKT conversion)

3.  Add reverse geocoding (optional)

- Show address when location is selected
- Uses Mapbox Geocoding API

Result: Users can click on map or enter coordinates when creating entities

---

Phase B: Entity Selector Field Type

Duration: ~1.5 hours

1.  Add entity_selector to field types (form-builder/field-types-config.ts)

- Define field type schema
- Add icon and configuration

2.  Create EntitySelectorField component (form-fields/entity-selector-field.tsx)

- Searchable dropdown of entities
- Filter by entity type
- Show entity details on select
- Validation support

3.  Update form renderer to handle entity_selector

- Render EntitySelectorField component
- Store entity ID in form data
- Display entity name in submissions

4.  Enhance form submission display

- Show linked entity name (not just ID)
- Link to entity detail page

Result: Forms can have "Select Entity" fields that link to actual entities

---

Phase C: Entity Status & Lifecycle (Optional)

Duration: ~2 hours

1.  Add status field to Entity model
    status: String @default("active") @db.VarChar(50)
2.  Create entity status management

- Status dropdown in entity forms
- Status filter in entity list
- Status badge display
- Predefined statuses: active, maintenance, retired, pending

3.  Add basic change tracking

- Track who changed status and when
- Display status history on entity page
- Optional: Email notifications on status change

4.  Status-aware queries

- Filter work orders by entity status
- Exclude retired entities from selection
- Dashboard metrics by status

Result: Track entity lifecycle and filter by operational status

---
