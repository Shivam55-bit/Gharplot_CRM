# Create/Edit Role Screen - Visual Guide

## Screen Layouts

### 1. Role List Screen (Main View)
```
┌─────────────────────────────┐
│ ← | Roles           | ⊕     │ ← Header (Dark Blue #1e293b)
├─────────────────────────────┤
│ 🔍 Search roles...          │ ← Search bar
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Senior Manager         │█│ ← Role Card
│ │ 5 employees assigned   │ │
│ │ • Leads: View, Assign  │ │
│ │ ✏️ | 🗑️                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Coordinator            │█│
│ │ 3 employees assigned   │ │
│ │ • Leads: View          │ │
│ │ ✏️ | 🗑️                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Admin                  │█│
│ │ 8 employees assigned   │ │
│ │ • Leads: View, Edit... │ │
│ │ ✏️ | 🗑️                 │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 2. Role Detail Modal
```
┌──────────────────────────────┐
│              X               │ ← Close button
│         👔                   │ ← Role icon
│   Senior Manager             │ ← Role name
│   Manages lead operations    │ ← Description
│                              │
│  Permissions                 │
│  • Leads: View, Assign       │
│  • Dashboard: View, Create   │
│                              │
│  [  ✏️  Edit Role  ]          │ ← Edit button
│  [  Close ]                  │ ← Close button
└──────────────────────────────┘
```

### 3. Create/Edit Role Modal (Full Screen)
```
┌──────────────────────────────┐
│              X               │ ← Close
│  Create New Role             │
│  Set permissions & assign    │
│  ─────────────────────────── │
│                              │
│  Role Name *                 │
│  ┌────────────────────────┐  │
│  │ Senior Manager         │  │
│  └────────────────────────┘  │
│                              │
│  Permissions *               │
│  Select what this role...    │
│  ┌────────────────────────┐  │
│  │ ☑  View Leads          │  │
│  │    LEAD_VIEW           │  │
│  │────────────────────────│  │
│  │ ☐  Assign Leads        │  │
│  │    LEAD_ASSIGN         │  │
│  │────────────────────────│  │
│  │ ☑  Edit Leads          │  │
│  │    LEAD_EDIT           │  │
│  │────────────────────────│  │
│  │ ☐  Delete Leads        │  │
│  │    LEAD_DELETE         │  │
│  └────────────────────────┘  │
│                              │
│  Assign Employees *      3   │ ← Selected count
│  Choose employees...      ⭕  │
│  ┌────────────────────────┐  │
│  │ ☑  Rajesh Kumar       │✓ │ ← Active (green)
│  │    rajesh.kumar@...   │   │
│  │────────────────────────│  │
│  │ ☑  Priya Singh        │✓ │
│  │    priya.singh@...    │   │
│  │────────────────────────│  │
│  │ ☐  Amit Patel         │◯ │ ← Inactive
│  │    amit.patel@...     │   │
│  │────────────────────────│  │
│  │ ☑  Neha Sharma        │✓ │
│  │    neha.sharma@...    │   │
│  │────────────────────────│  │
│  │ ☐  Vikram Reddy       │◯ │
│  │    vikram.reddy@...   │   │
│  └────────────────────────┘  │
│                              │
│  [ Cancel ] [ ✓ Create ]     │
└──────────────────────────────┘
```

---

## Color Codes & Usage

### Primary Colors
| Color | Code      | Usage |
|-------|-----------|-------|
| Blue  | #2563eb   | Buttons, Links, Active states |
| Green | #10b981   | Success, Checkmarks, Selected |
| Red   | #dc2626   | Danger, Delete actions |
| Gray  | #6b7280   | Secondary text, Disabled |

### Background Colors
| Color | Code      | Usage |
|-------|-----------|-------|
| Dark  | #1e293b   | Header background |
| White | #fff      | Cards, Modals |
| Light | #f8fafc   | Main background |
| Pale  | #f9fafb   | Form backgrounds |

### Border/Divider Colors
| Color | Code      | Usage |
|-------|-----------|-------|
| Light | #e5e7eb   | Card borders, Dividers |
| Pale  | #d1d5db   | Input borders, Icons |

---

## Component States

### Permission Checkbox
```
Unchecked:
┌────────────────┐
│ ☐ View Leads   │
│   LEAD_VIEW    │
└────────────────┘

Checked (Active):
┌────────────────┐
│ ☑ View Leads   │ ← Green background
│   LEAD_VIEW    │
└────────────────┘
```

### Employee Row
```
Unassigned:
┌───────────────────────────────────┐
│ ☐ Rajesh Kumar          ◯         │
│   rajesh.kumar@gharplot.com      │
└───────────────────────────────────┘

Assigned (Active):
┌───────────────────────────────────┐
│ ☑ Rajesh Kumar          ✓         │ ← Light green background
│   rajesh.kumar@gharplot.com      │
└───────────────────────────────────┘
```

### Input Field
```
Normal:
┌──────────────────────────┐
│ Role name            │
│ ┌────────────────────┐   │
│ │ Senior Manager     │   │
│ └────────────────────┘   │
└──────────────────────────┘

Error:
┌──────────────────────────┐
│ Role name            │
│ ┌────────────────────┐   │
│ │ Senior Manager     │   │ ← Red border & pink background
│ └────────────────────┘   │
│ ⚠️ Role name is required │ ← Error message
└──────────────────────────┘
```

---

## Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header Title | 20px | 700 | #fff |
| Modal Title | 20px | 700 | #1e293b |
| Label | 14px | 700 | #1e293b |
| Body Text | 14px | 600 | #1e293b |
| Secondary Text | 12px | 400 | #6b7280 |
| Permission ID | 11px | 400 | #9ca3af |
| Email | 12px | 400 | #6b7280 |

---

## Spacing & Sizing

### Padding/Margins
- **Header**: 12-16px vertical, 16px horizontal
- **Cards**: 16px padding
- **Section**: 24px bottom margin
- **Input**: 12px padding
- **Row**: 12-14px vertical, 14px horizontal

### Sizes
- **Checkbox**: 22x22px
- **Icon (Small)**: 18-20px
- **Icon (Large)**: 24-40px
- **Modal Width**: Full width on mobile
- **Modal Border Radius**: 20px (top only)
- **Card Border Radius**: 12px

---

## Interactions

### On Press Actions
- **Role Card**: Open detail modal
- **Edit Button**: Open create/edit modal with pre-filled data
- **Delete Button**: Show confirmation alert
- **Permission Row**: Toggle checkbox (add/remove permission)
- **Employee Row**: Toggle checkbox (assign/unassign)
- **Create Button**: Validate form → Show alert → Close modal
- **Cancel Button**: Close modal without saving

### Feedback
- ✓ Checkmark appears on selection
- ✓ Row background highlights when selected
- ✓ Count badge updates in real-time
- ✓ Error messages appear below fields
- ✓ Loading state shows spinner on submit button
- ✓ Success alert confirms action

---

## Form Validation Flow

```
User submits form
    ↓
validateForm() called
    ↓
Check 1: Role name required?
    ├─ No → setFormErrors.name
    └─ Yes → continue
    ↓
Check 2: At least 1 permission?
    ├─ No → setFormErrors.permissions
    └─ Yes → continue
    ↓
Check 3: At least 1 employee?
    ├─ No → setFormErrors.employees
    └─ Yes → continue
    ↓
All valid → Prepare payload → Console.log → Success alert
```

---

## Error Messages

| Field | Error Message |
|-------|---------------|
| Role Name | "Role name is required" |
| Permissions | "Select at least one permission" |
| Employees | "Assign at least one employee" |

---

## Sample Payload Output

When user clicks Create/Save:

```json
{
  "roleName": "Senior Manager",
  "permissions": [
    "LEAD_VIEW",
    "LEAD_ASSIGN",
    "LEAD_EDIT"
  ],
  "employees": [
    "emp001",
    "emp002",
    "emp004",
    "emp006"
  ]
}
```

Logged to console as:
```
=== ROLE PAYLOAD ===
{
  "roleName": "Senior Manager",
  "permissions": [
    "LEAD_VIEW",
    "LEAD_ASSIGN",
    "LEAD_EDIT"
  ],
  "employees": [
    "emp001",
    "emp002",
    "emp004",
    "emp006"
  ]
}
====================
```

---

## Responsive Design

### Mobile (Default)
- Full screen modals with slide-up animation
- Touch-friendly: 44px minimum tap target
- Single column layout for employees
- Stack buttons vertically if needed

### Tablet (if implemented)
- Could use side-by-side layout
- Larger modals with padding
- More employees per row

---

## Accessibility Features

✓ Semantic labels for inputs
✓ Clear visual feedback on interactions
✓ Error messages in context
✓ Icon + Text labels on buttons
✓ Color not the only indicator (icons + checkmarks)
✓ Readable font sizes (minimum 12px)
✓ Touch targets ≥ 44px (buttons)

---

## Animation & Transitions

- **Modal Entry**: `animationType="slide"` (bottom-up)
- **Ripple Effect**: Android ripple on cards
- **Fade In**: No delay (instant feedback)
- **Loading**: Spinner on submit button
- **Dismiss**: Instant close on cancel/success

---

## Browser/Platform Support

✓ iOS 12+
✓ Android 5.0+
✓ React Native 0.65+
✓ Ionicons icons (vector-based, scalable)

---

## Keyboard Behavior

- Text input shows keyboard on focus
- Keyboard dismissed on form submission
- Return key set to default
- No custom keyboard styling needed

---

## Loading States

### Initial Load
- FlatList shows ActivityIndicator while `loading = true`
- After load: Display role cards or empty state

### Form Submission
- Button text: "Create" → "Saving..." (with spinner)
- Button disabled during submission
- After success: Close modal + show alert

---

This visual guide helps understand the complete UI/UX flow and styling details.
