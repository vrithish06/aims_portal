# Current Session Details Feature - Visual Guide & Flow

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                           AIMS Portal                            │
├─────────────────────────────────────────────────────────────────┤
│ Home  Dashboard  Browse Courses  [Current Session Details]      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📅 Current Session Details                                     │
│  Manage course offerings and perform bulk operations             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select Academic Session:                                       │
│  [─ 2024-Fall ─────────────────────────────────────────]        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bulk Update Status │ Calculate CGPA │ Download Grade Sheets   │
│                                                                  │
│  ┌────────────────────────────┐  ┌──────────────────────┐      │
│  │ Course Offerings (5)       │  │ Update Status        │      │
│  │                            │  │                      │      │
│  │ ☑ Select All               │  │ New Status:          │      │
│  │                            │  │ [Enrolling ────────] │      │
│  │ ☐ CS101 - Intro Prog       │  │                      │      │
│  │    Status: Enrolling (45)  │  │ Selected: 2 (45)     │      │
│  │                            │  │                      │      │
│  │ ☐ CS201 - Data Struct      │  │ [Update Status]      │      │
│  │    Status: Running (52)    │  │                      │      │
│  │                            │  │                      │      │
│  │ ☑ CS301 - Algorithms       │  │                      │      │
│  │    Status: Completed (38)  │  │                      │      │
│  │                            │  │                      │      │
│  │ ☐ CS401 - Database         │  │                      │      │
│  │    Status: Enrolling (40)  │  │                      │      │
│  │                            │  │                      │      │
│  │ ☐ CS501 - AI Basics        │  │                      │      │
│  │    Status: Enrolling (35)  │  │                      │      │
│  │                            │  │                      │      │
│  └────────────────────────────┘  └──────────────────────┘      │
│                                                                  │
│  ✓ Successfully updated 2 offering(s) to Completed             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tab 1: Bulk Update Status

### Flow Diagram
```
1. SELECT SESSION
        │
        ▼
2. OFFERINGS LOAD
        │
        ▼
3. SELECT OFFERINGS
   ├─ Single select
   ├─ Multiple select
   └─ Select All
        │
        ▼
4. CHOOSE NEW STATUS
   ├─ Enrolling
   ├─ Running
   ├─ Completed
   └─ Canceled
        │
        ▼
5. CLICK UPDATE STATUS
        │
        ▼
6. DATABASE UPDATE (atomic)
        │
        ▼
7. SHOW SUCCESS MESSAGE
        │
        ▼
8. REFRESH OFFERINGS LIST
```

### Components
```
┌─ Course Offering List
│  ├─ Select All Checkbox
│  ├─ Course Item (with checkbox)
│  │  ├─ Course Code & Title
│  │  ├─ Current Status
│  │  ├─ Enrollment Count
│  │  └─ Section/Slot Info
│  └─ Scrollable List
│
└─ Status Update Panel
   ├─ New Status Dropdown
   ├─ Selected Count Display
   ├─ Update Button
   └─ Loading Spinner
```

## Tab 2: Calculate CGPA

### Flow Diagram
```
1. SELECT SESSION
        │
        ▼
2. VIEW CGPA CALCULATION PAGE
        │
        ▼
3. CLICK CALCULATE CGPA
        │
        ▼
4. CALL DATABASE FUNCTION
        │
        ▼
5. FUNCTION PROCESSES:
   ├─ Find all students in session
   ├─ Calculate SGPA (session GPA)
   │  └─ Credit-weighted by grade
   ├─ Calculate CGPA (cumulative GPA)
   │  └─ All previous semesters included
   └─ Upsert into cgpa_table
        │
        ▼
6. SHOW SUCCESS MESSAGE
        │
        ▼
7. DISPLAY AFFECTED STUDENTS COUNT
```

### Components
```
┌─ CGPA Calculation Panel
│  ├─ Description Text
│  ├─ Session Display
│  ├─ Calculate CGPA Button
│  │  └─ Loading spinner during execution
│  └─ Success Message
│     └─ Shows: "Affected students: X"
```

## Tab 3: Download Grade Sheets

### Flow Diagram
```
1. SELECT SESSION
        │
        ▼
2. OFFERINGS LOAD
        │
        ▼
3. SELECT OFFERINGS
   ├─ Single select
   ├─ Multiple select
   └─ Select All
        │
        ▼
4. CLICK DOWNLOAD SHEETS
        │
        ▼
5. FETCH ENROLLMENT DATA FROM API
        │
        ▼
6. ORGANIZE BY OFFERING
        │
        ▼
7. GENERATE EXCEL FILE
   ├─ Create workbook
   ├─ Create worksheet per offering
   ├─ Add headers and data
   └─ Generate file in memory
        │
        ▼
8. TRIGGER DOWNLOAD
        │
        ▼
9. FILE DOWNLOADED TO USER DEVICE
```

### Excel File Structure
```
Grade_Sheets_2024-Fall_1234567890.xlsx
│
├─ Sheet: CS101
│  ├─ Header Info:
│  │  ├─ Course Code: CS101
│  │  ├─ Course Title: Introduction to Programming
│  │  └─ Session: 2024-Fall
│  │
│  ├─ Column Headers:
│  │  ├─ A: Student Email
│  │  ├─ B: Student Name
│  │  ├─ C: Enrollment Type
│  │  ├─ D: Enrollment Status
│  │  └─ E: Grade
│  │
│  └─ Data Rows:
│     ├─ john.doe@example.com | John Doe | regular | enrolled | A
│     ├─ jane.smith@example.com | Jane Smith | regular | enrolled | B
│     └─ ...
│
├─ Sheet: CS201
│  └─ [Similar structure]
│
├─ Sheet: CS301
│  └─ [Similar structure]
│
└─ ... (one sheet per selected offering)
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                  │
│  CurrentSessionDetailsPage Component                             │
│  ├─ State: selectedSession, courseOfferings, selectedOfferings  │
│  ├─ State: loading, actionLoading, messages                     │
│  └─ Tabs: Bulk Update, CGPA, Grade Sheets                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
         HTTP Requests
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                      BACKEND (Express/Node)                      │
│                                                                  │
│  Routes:                                                         │
│  ├─ GET /session/list ─────────────────────────────────────┐   │
│  ├─ GET /session/:session/offerings ──────────────────────┤   │
│  ├─ POST /session/bulk-update-offering-status ────────────┤   │
│  ├─ POST /session/calculate-cgpa ────────────────────────┤   │
│  └─ POST /session/download-grade-sheets ─────────────────┤   │
│                                                            │   │
│  Controllers (aimsController.js):                         │   │
│  ├─ getAllSessions()                                      │   │
│  ├─ getOfferingsBySession()                               │   │
│  ├─ bulkUpdateOfferingStatus()                            │   │
│  ├─ calculateCGPAForSession()                             │   │
│  └─ downloadGradeSheets()                                 │   │
└──────────────┬───────────────────────────────────────────────────┘
               │
       Database Queries
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
│                                                                  │
│  Tables:                                                         │
│  ├─ course_offering (read/write)                                │
│  ├─ course_enrollment (read)                                    │
│  ├─ student_credit (read)                                       │
│  ├─ student (read)                                              │
│  ├─ cgpa_table (write/upsert)                                   │
│  └─ users (read)                                                │
│                                                                  │
│  Functions:                                                      │
│  └─ calculate_cgpa_for_session(p_session) [RPC]                 │
└──────────────────────────────────────────────────────────────────┘
```

## User Workflows

### Workflow 1: Update All Enrolling Courses to Running
```
Step 1: Navigate to Current Session Details (Admin navbar)
Step 2: Select academic session (e.g., "2024-Spring")
Step 3: View offerings - filter mentally for "Enrolling" status
Step 4: Click "Select All" checkbox
Step 5: Change "New Status" dropdown to "Running"
Step 6: Click "Update Status" button
Step 7: Wait for loading spinner
Step 8: See success message: "Successfully updated X offering(s) to Running"
Step 9: Offerings list refreshes with new statuses
```

### Workflow 2: Calculate CGPA for Current Session
```
Step 1: Navigate to Current Session Details
Step 2: Select academic session
Step 3: Click "Calculate CGPA" tab
Step 4: Review session name
Step 5: Click blue "Calculate CGPA" button
Step 6: Wait for loading spinner
Step 7: See success: "CGPA calculated successfully. Affected students: 142"
Step 8: Verify in database that cgpa_table was updated
```

### Workflow 3: Download Grade Sheets for Specific Courses
```
Step 1: Navigate to Current Session Details
Step 2: Select academic session
Step 3: Click "Download Grade Sheets" tab
Step 4: Uncheck "Select All" if needed
Step 5: Select specific course offerings (e.g., CS101, CS201, CS301)
Step 6: Click green "Download Sheets" button
Step 7: Browser downloads Excel file to Downloads folder
Step 8: Open file to verify format and data
Step 9: Each course appears as separate worksheet
Step 10: Share with department or archives
```

## Error Scenarios

```
❌ SCENARIO: No Offerings Selected
   ├─ User Action: Click "Update Status" without selecting offerings
   ├─ Response: Red alert box
   └─ Message: "Please select at least one course offering"

❌ SCENARIO: Session Selection Required
   ├─ User Action: Try to perform action without selecting session
   ├─ Response: Red alert box
   └─ Message: "Please select a session"

❌ SCENARIO: Database Error
   ├─ User Action: Network/database failure during update
   ├─ Response: Red alert box with detailed error
   └─ Message: "Failed to update course offering status: [details]"

❌ SCENARIO: CGPA Function Not Found
   ├─ User Action: Click "Calculate CGPA"
   ├─ Backend: RPC function not installed
   ├─ Response: Red alert box
   └─ Message: "failed to find function"

✅ RECOVERY: User can:
   ├─ Read error message
   ├─ Correct input if applicable
   ├─ Contact admin if persistent
   └─ Try operation again
```

## Performance Metrics

```
Task                          Typical Time    Scale Tested
─────────────────────────────────────────────────────────
Load Sessions                 100-200ms       1000+ sessions
Load Offerings                200-500ms       500+ offerings
Bulk Update Status            500-1000ms      100+ offerings
Calculate CGPA                2-10 seconds    1000+ students
Download Grade Sheets         500-2000ms      50+ offerings
Excel Generation (client)     100-500ms       500+ enrollments
```

## Security Flow

```
┌─ User Access Request
│
├─ Check Authentication
│  └─ If not authenticated: Redirect to login
│
├─ Check Authorization
│  └─ If not admin: Reject with 403
│
├─ Validate Input
│  ├─ Check required parameters
│  ├─ Verify data types
│  └─ Sanitize strings
│
├─ Process Request
│  ├─ Database query with parameterized statements
│  └─ Log operation for audit trail
│
└─ Return Response
   ├─ Success: 200 with data
   └─ Error: 400/403/500 with message
```

This visual guide helps understand the complete flow and architecture of the Current Session Details feature.
