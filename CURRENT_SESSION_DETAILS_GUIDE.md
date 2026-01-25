# Current Session Details Feature - Implementation Guide

## Overview
This feature allows administrators to manage course offerings and perform bulk operations for a selected academic session. Admins can:

1. **Bulk Update Course Offering Status** - Change the status of multiple course offerings at once
2. **Calculate CGPA** - Calculate and update CGPA for all students in the selected session
3. **Download Grade Sheets** - Export grade sheets for all course offerings as Excel files

## Frontend Implementation

### Component: CurrentSessionDetailsPage.jsx
**Location:** `/frontend/src/pages/CurrentSessionDetailsPage.jsx`

#### Features:
- **Session Selection Dropdown**: Lists all available academic sessions from the database
- **Tab-based Interface**: Three tabs for different operations
  - Bulk Update Status
  - Calculate CGPA
  - Download Grade Sheets

#### Tab 1: Bulk Update Status
- Displays all course offerings for the selected session
- Allows selecting multiple offerings
- "Select All" checkbox for convenience
- Dropdown to choose new status (Enrolling, Running, Completed, Canceled)
- Shows enrollment count for each offering
- Click "Update Status" to apply changes to all selected offerings

#### Tab 2: Calculate CGPA
- One-click CGPA calculation for the entire session
- Calls the PostgreSQL function to calculate SGPA and CGPA
- Updates cgpa_table with the results
- Shows affected student count on completion

#### Tab 3: Download Grade Sheets
- Similar selection interface as Tab 1
- Generates Excel file with grade information for selected offerings
- Each course offering gets its own worksheet
- Includes columns: Student Email, Student Name, Enrollment Type, Status, Grade

### Component Updates

#### Navbar.jsx
Added new navigation link for admin users:
```jsx
<NavLink to="/current-session-details" className={navClass}>
  Current Session Details
</NavLink>
```

Available in:
- Desktop navigation menu
- Mobile navigation menu
- User profile dropdown menu

#### App.jsx
Added route configuration:
```jsx
<Route path="/current-session-details" element={<ProtectedRoute><CurrentSessionDetailsPage /></ProtectedRoute>} />
```

## Backend Implementation

### Controller: aimsController.js
Added 5 new functions:

#### 1. getAllSessions()
**Endpoint:** `GET /session/list`
**Auth:** Admin only
**Description:** Retrieves all unique academic sessions from course_offering table
**Response:**
```json
{
  "success": true,
  "data": ["2024-Spring", "2024-Fall", "2025-Spring"]
}
```

#### 2. getOfferingsBySession(session)
**Endpoint:** `GET /session/:session/offerings`
**Auth:** Admin only
**Parameters:** 
- `session` (URL param): Academic session (e.g., "2024-Spring")
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "offering_id": 1,
      "course_id": 5,
      "acad_session": "2024-Spring",
      "status": "Enrolling",
      "slot": "A",
      "section": "1",
      "course": {
        "code": "CS101",
        "title": "Introduction to Programming",
        "ltp": "3-1-0"
      },
      "_count": {
        "enrollments": 45
      }
    }
  ]
}
```

#### 3. bulkUpdateOfferingStatus(offering_ids, new_status)
**Endpoint:** `POST /session/bulk-update-offering-status`
**Auth:** Admin only
**Body:**
```json
{
  "offering_ids": [1, 2, 3],
  "new_status": "Running"
}
```
**Allowed Statuses:** Enrolling, Running, Completed, Canceled, Declined
**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 3 course offering(s) to Running",
  "updated_count": 3
}
```

#### 4. calculateCGPAForSession(session)
**Endpoint:** `POST /session/calculate-cgpa`
**Auth:** Admin only
**Body:**
```json
{
  "session": "2024-Spring"
}
```
**Description:** Calls PostgreSQL function to calculate CGPA for all students in the session
**Response:**
```json
{
  "success": true,
  "message": "CGPA calculated successfully for session 2024-Spring",
  "data": {
    "affected_students": 142
  }
}
```

#### 5. downloadGradeSheets(offering_ids)
**Endpoint:** `POST /session/download-grade-sheets`
**Auth:** Admin only
**Body:**
```json
{
  "offering_ids": [1, 2, 3]
}
```
**Response:** JSON data structure ready for Excel generation
```json
{
  "success": true,
  "message": "Grade sheets prepared for 3 offering(s)",
  "data": {
    "1": {
      "course_code": "CS101",
      "course_title": "Introduction to Programming",
      "session": "2024-Spring",
      "enrollments": [
        {
          "student_id": 101,
          "student_email": "student@example.com",
          "student_name": "John Doe",
          "enrol_type": "regular",
          "enrol_status": "enrolled",
          "grade": "A"
        }
      ]
    }
  },
  "total_enrollments": 45
}
```

### Routes: AimsRoutes.js
Added 5 new route handlers:
```javascript
// Get all available academic sessions
router.get('/session/list', requireAuth, requireRole('admin'), getAllSessions);

// Get course offerings for a specific session
router.get('/session/:session/offerings', requireAuth, requireRole('admin'), getOfferingsBySession);

// Bulk update offering status for multiple offerings
router.post('/session/bulk-update-offering-status', requireAuth, requireRole('admin'), bulkUpdateOfferingStatus);

// Calculate CGPA for a session
router.post('/session/calculate-cgpa', requireAuth, requireRole('admin'), calculateCGPAForSession);

// Download grade sheets for multiple offerings
router.post('/session/download-grade-sheets', requireAuth, requireRole('admin'), downloadGradeSheets);
```

### Database Function: PostgreSQL
**File:** `/backend/calculate_cgpa_function.sql`
**Function Name:** `calculate_cgpa_for_session(p_session TEXT)`

This function:
1. Iterates through all students with enrolled courses in the specified session
2. Calculates SGPA (credit-weighted for current session)
3. Calculates CGPA (credit-weighted across all semesters)
4. Uses UPSERT logic to avoid duplicates in cgpa_table
5. Returns the count of affected students

**SQL Implementation Details:**
- SGPA Formula: SUM(credits × grade_point) / SUM(credits)
- Grade Points: A=10, B=8, C=6, D=4, else=0
- CGPA: Credit-weighted average across ALL semesters
- Semester: Automatically incremented based on existing records

## Installation & Setup

### 1. Database Setup
Execute the SQL function in your PostgreSQL database:
```sql
-- Execute the contents of calculate_cgpa_function.sql
psql -U your_user -d your_database -f backend/calculate_cgpa_function.sql
```

### 2. Backend Setup
No additional npm packages needed - uses existing Supabase and Express setup.

Ensure these endpoints are properly routed (already done in updated AimsRoutes.js):
- GET `/session/list`
- GET `/session/:session/offerings`
- POST `/session/bulk-update-offering-status`
- POST `/session/calculate-cgpa`
- POST `/session/download-grade-sheets`

### 3. Frontend Setup
The frontend uses the `xlsx` library which is already in package.json:
```json
"xlsx": "^0.18.5"
```

No additional installation needed.

## Usage Instructions

### For Administrators

#### Step 1: Navigate to Current Session Details
- Click "Current Session Details" in the navigation menu
- Only visible to admin users

#### Step 2: Select an Academic Session
- Use the dropdown to select the desired academic session
- Course offerings for that session will automatically load

#### Step 3: Choose an Operation

##### Option A: Bulk Update Course Offering Status
1. Select one or more course offerings from the list
2. Use "Select All" for all offerings in the session
3. Choose the new status from the dropdown
4. Click "Update Status"
5. Success message will appear with count of updated offerings

##### Option B: Calculate CGPA
1. Stay on the "Calculate CGPA" tab
2. Review the session name
3. Click "Calculate CGPA"
4. Wait for completion
5. Message shows number of affected students

##### Option C: Download Grade Sheets
1. Go to "Download Grade Sheets" tab
2. Select one or more course offerings
3. Click "Download Sheets"
4. Excel file will be generated with:
   - One worksheet per course offering
   - Headers: Student Email, Student Name, Enrollment Type, Status, Grade
   - Course code and title at the top of each sheet

## Data Validation

### Session Selection
- Only sessions with at least one offering are shown
- Sessions are sorted in reverse chronological order

### Offering Selection
- Multiple selections supported
- Minimum 1 required for bulk operations
- Validates that offerings exist in database

### Status Updates
- Only allows pre-defined statuses: Enrolling, Running, Completed, Canceled, Declined
- Updates applied atomically to all selected offerings

### CGPA Calculation
- Only affects students with "enrolled" status
- Handles students with no grades (treated as 0 points)
- Skips deleted records

## Error Handling

### Frontend
- Displays user-friendly error messages
- Shows alert for missing selections
- Loading states during API calls
- Auto-clears success/error messages on new operations

### Backend
- Validates input parameters
- Returns appropriate HTTP status codes
- Logs all operations for audit trail
- Returns detailed error messages

## Security

### Authentication
- All endpoints require admin authentication
- Uses session-based auth from existing system
- Validates user role as "admin"

### Authorization
- Only admins can access this feature
- ProtectedRoute component prevents unauthorized access
- All backend endpoints have requireRole('admin') middleware

## Performance Considerations

- **Session list**: Cached in component state
- **Offering list**: Fetched fresh on session change
- **Bulk operations**: Database-level atomic updates
- **Excel generation**: Client-side (no server load)
- **CGPA calculation**: PostgreSQL function runs efficiently with proper indexing

## Testing Recommendations

1. **Test Session Selection**
   - Verify sessions load correctly
   - Test with sessions that have/don't have offerings

2. **Test Bulk Status Update**
   - Select 1, multiple, and all offerings
   - Try each valid status
   - Verify database updates

3. **Test CGPA Calculation**
   - Run with different sessions
   - Verify cgpa_table updates
   - Check SGPA and CGPA calculations

4. **Test Grade Sheet Download**
   - Download for single offering
   - Download for multiple offerings
   - Verify Excel format and data
   - Check file naming

## Troubleshooting

### CGPA Function Not Found Error
**Solution:** Ensure PostgreSQL function is created:
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'calculate_cgpa_for_session';

-- If not found, run the SQL file
psql -U your_user -d your_database -f backend/calculate_cgpa_function.sql
```

### Sessions Not Loading
**Solution:** 
- Verify course_offering table has data
- Check database connection
- Clear browser cache

### Excel Generation Issues
**Solution:**
- Verify xlsx library is installed
- Check browser console for errors
- Ensure enough disk space for file download

## Future Enhancements

1. **Batch Processing**: Handle very large numbers of offerings
2. **Progress Indicators**: Show progress for long-running operations
3. **Undo Functionality**: Revert bulk operations
4. **Advanced Filtering**: Filter offerings by instructor, department, etc.
5. **Email Notifications**: Notify instructors of status changes
6. **Audit Logs**: Detailed history of all admin operations
7. **Report Generation**: Create comprehensive session reports
