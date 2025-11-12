# Enhanced Form Builder - Sections & Conditional Logic ✅

## What Was Implemented

The form builder has been significantly enhanced to support:

### 1. **Multiple Sections** ✅
- Create, edit, and delete form sections
- Drag & drop to reorder sections
- Each section has:
  - Title (required)
  - Description (optional)
  - Conditional visibility rules (optional)
  - Independent list of fields

### 2. **Conditional Logic for Sections** ✅
- Show/hide entire sections based on field values
- Support for AND/OR logic
- Available operators: equals, not_equals, contains, not_contains, greater_than, less_than, in, not_in, regex
- Can reference fields from previous sections only (prevents circular dependencies)

### 3. **Conditional Logic for Fields** ✅
- Show/hide individual fields based on other field values
- Same operators and logic as sections
- Integrated into Field Properties Panel
- Can reference any field that appears before the current field

### 4. **Enhanced UX** ✅
- Visual section cards with collapse/expand
- "Conditional" badge for sections/fields with rules
- Inline "Add Field to This Section" button
- Better organization with drag & drop support
- Properties panel shows conditional logic builder

## New Components Created

### 1. `SectionCard`
**File:** `/apps/web/src/components/form-builder/section-card.tsx`

Displays a section with:
- Drag handle for reordering
- Section title and description
- Conditional badge if rules are set
- Edit/delete buttons
- Collapse/expand toggle
- "Add Field" button

### 2. `SectionEditorDialog`
**File:** `/apps/web/src/components/form-builder/section-editor-dialog.tsx`

Modal dialog for creating/editing sections:
- Title input (required)
- Description textarea (optional)
- Conditional logic builder
- Shows available fields for conditions

### 3. `SimpleConditionalBuilder`
**File:** `/apps/web/src/components/form-builder/simple-conditional-builder.tsx`

User-friendly conditional logic builder:
- Add/remove conditions
- Field selector dropdown
- Operator selector (equals, contains, etc.)
- Value input
- AND/OR logic toggle
- Clear all conditions button

### 4. Enhanced `FieldPropertiesPanel`
**File:** `/apps/web/src/components/form-builder/field-properties-panel.tsx`

Updated to include:
- Conditional visibility section at the bottom
- Uses SimpleConditionalBuilder
- Only shows fields that appear before the current field
- Prevents self-referencing conditions

### 5. Enhanced Form Builder Page
**File:** `/apps/web/src/app/dashboard/forms/new/page.tsx`

Complete rewrite to support:
- Section management (add, edit, delete, reorder)
- Fields organized by section
- Drag & drop within sections
- Properties panel with conditional logic
- Save form with full section structure

## How to Use

### Creating a Form with Sections

1. **Navigate** to Dashboard → Forms → Create Form

2. **Add Sections**:
   - Click "Add Section" button in header
   - Enter section title (required)
   - Add optional description
   - Click "Create Section"

3. **Add Fields to Sections**:
   - Click a field type from the left palette
   - Field will be added to the currently selected section
   - Or click "Add Field to This Section" button on the section card

4. **Reorder Sections**:
   - Drag sections using the grip handle

5. **Edit Section**:
   - Click the settings icon on the section card
   - Update title, description, or conditional rules

6. **Delete Section**:
   - Click the trash icon (only if you have more than one section)
   - Confirm deletion (all fields in the section will be deleted)

### Adding Conditional Logic to Sections

1. **Edit the Section**:
   - Click the settings icon on the section

2. **Set Conditions**:
   - Scroll to "Conditional Visibility"
   - Click "Add Condition"
   - Select field, operator, and value
   - Add more conditions if needed
   - Choose AND/OR logic

3. **Example**: Show "Issue Details" section only when "issue_found" equals "yes"
   ```
   Field: issue_found
   Operator: Equals
   Value: yes
   ```

### Adding Conditional Logic to Fields

1. **Select the Field**:
   - Click on the field in the canvas

2. **Open Properties Panel**:
   - Properties panel opens on the right

3. **Scroll to Conditional Visibility**:
   - At the bottom of the properties panel

4. **Add Conditions**:
   - Same as section conditions
   - Only fields from earlier in the form are available

5. **Example**: Show "equipment_other" field only when "equipment_type" equals "other"
   ```
   Field: equipment_type
   Operator: Equals
   Value: other
   ```

## Example Form Schema

The enhanced builder creates forms like this:

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Equipment Information",
      "fields": [
        {
          "id": "equipment_type",
          "type": "select",
          "label": "Equipment Type",
          "required": true,
          "options": {
            "source": "static",
            "value": [
              { "label": "Generator", "value": "generator" },
              { "label": "Other", "value": "other" }
            ]
          }
        },
        {
          "id": "equipment_other",
          "type": "text",
          "label": "Please specify",
          "required": true,
          "visible": {
            "type": "rule",
            "value": {
              "conditions": {
                "all": [
                  {
                    "field": "equipment_type",
                    "operator": "equals",
                    "value": "other"
                  }
                ]
              }
            }
          }
        }
      ]
    },
    {
      "id": "section-2",
      "title": "Issue Details",
      "description": "Only shown if issue found",
      "visible": {
        "type": "rule",
        "value": {
          "conditions": {
            "all": [
              {
                "field": "issue_found",
                "operator": "equals",
                "value": "yes"
              }
            ]
          }
        }
      },
      "fields": [...]
    }
  ]
}
```

## Operators Available

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | field = "yes" |
| `not_equals` | Not equal | field != "no" |
| `contains` | String/array contains | field contains "urgent" |
| `not_contains` | Does not contain | field not contains "test" |
| `greater_than` | Numeric > | age > 18 |
| `less_than` | Numeric < | price < 100 |
| `in` | Value in array | status in ["pending", "active"] |
| `not_in` | Value not in array | status not in ["archived"] |
| `regex` | Regex match | email matches pattern |

## Logic Types

- **ALL (AND)**: All conditions must be true
- **ANY (OR)**: At least one condition must be true

## Features

✅ Multiple sections
✅ Section reordering (drag & drop)
✅ Conditional section visibility
✅ Conditional field visibility
✅ AND/OR logic
✅ Multiple operators (equals, contains, greater_than, etc.)
✅ Visual condition builder
✅ Field reference validation (prevents circular dependencies)
✅ Collapse/expand sections
✅ Inline add field buttons
✅ Visual "Conditional" badges

## Limitations & Notes

1. **Cross-section dependencies**:
   - Sections can only reference fields from previous sections
   - This prevents circular dependencies

2. **Field dependencies**:
   - Fields can only reference fields that appear earlier
   - Self-referencing is prevented

3. **Edit Page**:
   - The edit page (`/dashboard/forms/[id]/edit`) still uses the old flat structure
   - It can be updated using the same pattern as the new builder

## Next Steps

To also update the edit page:

1. Replace `/apps/web/src/app/dashboard/forms/[id]/edit/page.tsx` with enhanced version
2. Load existing sections from template schema
3. Support editing forms that were created with the old builder (single section)

## Testing

1. Create a new form at `/dashboard/forms/new`
2. Add multiple sections
3. Add fields to different sections
4. Set conditional rules on sections
5. Set conditional rules on fields
6. Save and fill the form
7. Verify conditional logic works as expected

---

**Status**: ✅ **Fully Implemented**

The enhanced form builder with sections and conditional logic is now live!
