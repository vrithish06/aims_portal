# AddOfferingPage Implementation Summary

## Overview
Created a comprehensive course offering creation system with the following components:

## Backend Changes

### New Controller Functions (aimsController.js)

1. **searchCourses()**
   - Endpoint: `GET /courses/search?code=<code>`
   - Searches course table by code (case-insensitive partial match)
   - Returns: Array of matching courses with `course_id, code, title, ltp, status`
   - No authentication required

2. **getAllInstructors()**
   - Endpoint: `GET /instructors/all`
   - Fetches all active instructors with their user details
   - Returns: Instructor objects with nested user info (name, email, etc.)
   - Requires authentication

3. **createOfferingWithInstructors()**
   - Endpoint: `POST /offering/create-with-instructors`
   - Creates course offering with multiple instructors
   - Validates:
     - Course exists and is not deleted
     - At least one instructor is provided
     - Exactly one instructor is marked as coordinator (enforced)
   - Creates entries in both:
     - `course_offering` table
     - `course_offering_instructor` table (junction table)
   - Requires instructor/admin role

### New Routes (AimsRoutes.js)
```javascript
router.get('/courses/search', searchCourses);
router.get('/instructors/all', requireAuth, getAllInstructors);
router.post('/offering/create-with-instructors', requireAuth, requireRole('instructor'), createOfferingWithInstructors);
```

## Frontend Implementation

### AddOfferingPage.jsx Features

#### 1. Course Search & Selection
- Real-time search as user types course code
- Displays search results in dropdown with:
  - Course code
  - Course title
  - Credits (L-T-P)
- Click to select, removes search and shows selected course in a card
- Can deselect to search again

#### 2. Offering Details Form
- **Academic Session**: Required text field
- **Status**: Dropdown with options (Enrolling, Running, Completed, Cancelled)
- **Slot**: Optional text field (e.g., "A1")
- **Section**: Optional text field (e.g., "1", "A")

#### 3. Instructor Management
- **Search & Add Instructors**:
  - Real-time search by name or email
  - Dropdown shows available instructors
  - Shows instructor name and email
  - Plus icon to add
  
- **Selected Instructors Display**:
  - Shows all added instructors in a list
  - Each instructor card displays name and email
  - Shows coordinator status with toggle button
  - Remove button (X) to delete instructor
  
- **Coordinator Functionality**:
  - Toggle button switches coordinator status
  - Automatically ensures only one coordinator at a time
  - Frontend validation before submission
  - Green indicator when one coordinator is assigned

#### 4. Form Validation
- Course selection required
- Academic session required
- At least one instructor required
- Exactly one coordinator required
- All validations with helpful toast messages

#### 5. UI/UX Features
- Back button navigation
- Loading states during API calls
- Disabled submit button until form is valid
- Error and success toast notifications
- Clean, modern design with Tailwind CSS
- Responsive layout

## Database Structure Used

### course table
```
- course_id (PK)
- code (unique)
- title
- ltp
- status
- is_deleted
```

### course_offering table
```
- offering_id (PK)
- course_id (FK to course)
- acad_session
- status
- slot
- section
- is_deleted
```

### course_offering_instructor table
```
- id (PK)
- offering_id (FK to course_offering)
- instructor_id (FK to instructor)
- is_coordinator (boolean)
- UNIQUE constraint: (offering_id, instructor_id)
```

### instructor table
```
- instructor_id (PK)
- user_id (FK to users)
- is_deleted
```

### users table
```
- id (PK)
- first_name
- last_name
- email
- role
```

## API Endpoints Summary

### Search Courses
- **Method**: GET
- **URL**: `/courses/search?code=<courseCode>`
- **Auth**: None
- **Response**: `{ success: boolean, data: Course[] }`

### Get All Instructors
- **Method**: GET
- **URL**: `/instructors/all`
- **Auth**: Required
- **Response**: `{ success: boolean, data: Instructor[] }`

### Create Offering with Instructors
- **Method**: POST
- **URL**: `/offering/create-with-instructors`
- **Auth**: Required (instructor/admin role)
- **Body**:
```json
{
  "course_id": 1,
  "acad_session": "Fall 2024",
  "status": "Enrolling",
  "slot": "A1",
  "section": "1",
  "instructors": [
    {
      "instructor_id": 1,
      "is_coordinator": true
    },
    {
      "instructor_id": 2,
      "is_coordinator": false
    }
  ]
}
```
- **Response**: `{ success: boolean, data: { offering, instructors } }`

## Key Features Implemented

✅ Real-time course code search with instant results
✅ Multiple instructor selection
✅ Coordinator role management (enforces single coordinator)
✅ Form validation at frontend and backend
✅ Proper error handling and user feedback
✅ Clean, intuitive UI
✅ Automatic navigation after successful submission
✅ Proper database relationships and constraints

## Usage

1. Admin/Instructor navigates to Add Offering page
2. Searches for and selects a course code
3. Enters academic session, status, slot, and section
4. Searches and adds instructors one by one
5. Toggles coordinator status (ensures only one)
6. Submits form
7. Backend validates and creates offering with all instructors
8. Success notification and redirect to offerings list
