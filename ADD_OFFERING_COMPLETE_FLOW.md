# AddOfferingPage Complete Feature Overview

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Instructor/Admin User                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                ┌───────────────────────┐
                │  Navigate to          │
                │  /add-offering        │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Search Course Code   │◄──── Real-time API search
                │  Input Field          │      (/courses/search)
                └───────────┬───────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Display Search Results Dropdown       │
        │  - Course Code                        │
        │  - Title                              │
        │  - Credits (LTP)                      │
        └───────────┬───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────┐
        │  Click to Select Course               │
        └───────────┬───────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────────┐
    │  Show Selected Course Card                     │
    │  - Can deselect to search again               │
    └───────────┬───────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────────────────────┐
    │  Fill in Offering Details                         │
    │  ✓ Academic Session (required)                    │
    │  ✓ Status (dropdown: Enrolling, Running, etc)     │
    │  ✓ Slot (optional)                               │
    │  ✓ Section (optional)                            │
    └───────────┬───────────────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────────────────────────────┐
    │  Search & Add Instructors                           │
    │  - Type to search by name/email                     │
    │  - Click + to add from dropdown                     │
    │  (/instructors/all - API call)                      │
    └───────────┬─────────────────────────────────────────┘
                │
                ▼
    ┌──────────────────────────────────────────────────────┐
    │  Manage Selected Instructors                         │
    │  For each instructor:                               │
    │  - Show name & email                               │
    │  - Toggle Coordinator status (exactly 1 required)  │
    │  - Remove button (X)                               │
    └───────────┬──────────────────────────────────────────┘
                │
                ▼
    ┌──────────────────────────────────────────────────────┐
    │  Validate Form:                                      │
    │  ✓ Course selected                                  │
    │  ✓ Academic session filled                          │
    │  ✓ At least 1 instructor added                      │
    │  ✓ Exactly 1 coordinator selected                   │
    └───────────┬──────────────────────────────────────────┘
                │
                ├─────No─────► Show Error Toast
                │
                └─────Yes────┐
                             ▼
            ┌────────────────────────────────────┐
            │  Submit Form (POST request)        │
            │  /offering/create-with-instructors│
            └────────────┬─────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  Backend Processing:               │
        │  1. Validate course exists         │
        │  2. Verify instructor IDs valid    │
        │  3. Create course_offering record  │
        │  4. Create junction table entries  │
        │  5. Ensure 1 coordinator          │
        └────────────┬─────────────────────┘
                     │
                     ├────Error────┐
                     │             ▼
                     │    Show Error Toast
                     │
                     └────Success──┐
                                   ▼
                    ┌─────────────────────────────┐
                    │  Show Success Toast Message │
                    │  Redirect to:               │
                    │  /my-offerings              │
                    └─────────────────────────────┘
```

## Component Structure

```
AddOfferingPage
├── State Management
│   ├── Course Selection
│   │   ├── courseSearchQuery
│   │   ├── courseSearchResults
│   │   └── selectedCourse
│   │
│   ├── Offering Details
│   │   ├── acad_session
│   │   ├── status
│   │   ├── slot
│   │   └── section
│   │
│   ├── Instructor Management
│   │   ├── availableInstructors
│   │   ├── selectedInstructors
│   │   ├── instructorSearch
│   │   └── showInstructorDropdown
│   │
│   └── UI State
│       ├── loading
│       ├── submitting
│       └── showSearchResults
│
├── Effects
│   ├── Outside click handler (close dropdowns)
│   └── Load instructors on mount
│
├── Handlers
│   ├── handleCourseSearch() ─► API: /courses/search
│   ├── handleSelectCourse()
│   ├── handleAddInstructor()
│   ├── handleRemoveInstructor()
│   ├── handleToggleCoordinator()
│   └── handleSubmit() ─► API: /offering/create-with-instructors
│
└── Render
    ├── Course Search Section
    │   ├── Search input
    │   ├── Results dropdown
    │   └── Selected course card
    │
    ├── Form Fields
    │   ├── Academic session input
    │   ├── Status dropdown
    │   ├── Slot input
    │   └── Section input
    │
    ├── Instructor Section
    │   ├── Search & add input
    │   ├── Instructor dropdown
    │   └── Selected instructors list
    │
    └── Action Buttons
        ├── Submit button (disabled if invalid)
        └── Cancel button
```

## API Integration Points

### 1. Search Courses
```
GET /courses/search?code=CS
├── Purpose: Real-time search as user types
├── Trigger: onChange event on course input
├── Response: List of matching courses
└── Handled By: handleCourseSearch()
```

### 2. Fetch Instructors
```
GET /instructors/all
├── Purpose: Load all available instructors
├── Trigger: useEffect on component mount
├── Response: List of instructors with user details
└── Handled By: useEffect hook
```

### 3. Create Offering
```
POST /offering/create-with-instructors
├── Purpose: Create course offering with instructors
├── Trigger: Form submission
├── Payload: {
│   course_id: number,
│   acad_session: string,
│   status: string,
│   slot: string|null,
│   section: string|null,
│   instructors: [{instructor_id, is_coordinator}, ...]
│ }
├── Response: Created offering and instructor records
└── Handled By: handleSubmit()
```

## Validation Layers

### Frontend Validation
```javascript
// In handleSubmit():
1. Course selected? ✓
2. Academic session filled? ✓
3. At least 1 instructor? ✓
4. Exactly 1 coordinator? ✓
   └─ If any fail → Show toast error & return
```

### Backend Validation
```javascript
// In createOfferingWithInstructors():
1. All required fields present? ✓
2. Exactly 1 coordinator? ✓
3. Course exists & not deleted? ✓
4. Instructors exist? ✓
   └─ If any fail → Return 400/404 error
```

### Database Constraints
```sql
-- Unique constraint prevents duplicate instructor assignments
UNIQUE (offering_id, instructor_id)

-- Check constraint ensures valid status values
CHECK (status IN ('Enrolling', 'Running', 'Completed', 'Cancelled'))

-- Foreign keys ensure referential integrity
FK: course_id → course.course_id
FK: instructor_id → instructor.instructor_id
FK: offering_id → course_offering.offering_id
```

## UI Components Used

```
Material Icons from lucide-react:
├── Search (for search inputs)
├── ArrowLeft (for back button)
├── Plus (for add instructor button)
├── X (for remove buttons)
└── Check (for coordinator indicator)

Form Elements:
├── input (text)
├── select (dropdown)
├── button (submit, cancel)
└── custom dropdown (for search results)

Status Display:
├── Toast notifications (success/error)
├── Loading spinner
├── Status badges (coordinator indicator)
└── Disabled button states
```

## Error Handling

```
Search Course Errors:
├── Empty query → Clear results, hide dropdown
├── API error → Log error, show empty state
└── No results → Show "No courses found" message

Add Instructor Errors:
├── Duplicate → Show toast "Instructor already added"
├── Load error → Show toast "Failed to load instructors"
└── Selection error → Prevent adding if limit reached

Form Submission Errors:
├── Validation → Show toast with specific error
├── API error → Show toast with server error message
└── Network error → Show generic error toast

Success:
├── Creation successful → Show success toast
├── Auto-redirect → Navigate to /my-offerings after 1.5s
└── Form reset → Clear all fields
```

## Performance Optimizations

1. **Debounced Search**: Course search on every keystroke (minimal impact)
2. **Ref-based Dropdowns**: useRef for outside-click detection (efficient)
3. **Memoized Instructor Filtering**: Filtered instructors computed on each render
4. **Early Returns**: Validation checks prevent unnecessary API calls
5. **Single API Call on Mount**: Instructors loaded once when component mounts

## Accessibility Features

```
✓ Input labels with htmlFor
✓ Placeholder text for guidance
✓ Error messages via toast (also visible in console)
✓ Button disabled states clear
✓ Keyboard navigation (inputs, selects, buttons)
✓ Focus management (ref handling)
✓ ARIA labels on icons
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Supabase client library compatible
- React 18+ required
- Tailwind CSS for styling

## Mobile Responsiveness

```jsx
// The form is responsive:
- Grid layout adapts to screen size
- Dropdowns open above/below as needed
- Touch-friendly button sizes (min 44px)
- Full-width inputs on mobile
- Proper spacing for touch interaction
```
