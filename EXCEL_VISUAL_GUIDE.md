# Excel Feature - Visual Guide & Step-by-Step Walkthrough

## Feature Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Course Details Page                          │
│                  (Enrollments Tab)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
        │  DOWNLOAD   │ │ UPLOAD GRADES│ │   APPROVE    │
        │   Button    │ │   Button     │ │   Button     │
        └─────────────┘ └──────────────┘ └──────────────┘
                │             │
        ┌───────▼────┐ ┌──────▼────────┐
        │   Excel    │ │   File Input  │
        │ Generation │ │   Dialog      │
        └────────────┘ └───────────────┘
                │             │
        ┌───────▼────┐ ┌──────▼────────┐
        │   Download │ │   Validation  │
        │    File    │ │   (Columns,   │
        │            │ │   Emails)     │
        └────────────┘ └───────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Upload   │
                    │   Endpoint     │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Update Grades │
                    │  in Database   │
                    │  (course_      │
                    │   enrollment)  │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Auto Trigger  │
                    │  Updates       │
                    │  student_credit│
                    └────────────────┘
```

---

## Download Workflow

### Step 1: Locate Download Button
```
Course Details Page
    ↓
Click "Enrollments" Tab
    ↓
Find "Download" Button (top right, blue outline)
    ↓
[Download] [Upload Grades]
```

### Step 2: Click Download
```
┌─────────────────────────────────────────┐
│  Filters | [Download] [Upload Grades]  │
│                  ↑                      │
│             Click Here                  │
└─────────────────────────────────────────┘
```

### Step 3: File Generated & Downloaded
```
Browser Download:
    CSE101_Enrollments_Fall2024.xlsx
    
File Contents:
┌──────────────────┬──────────────────────┬─────────────────────────┐
│  Student Name    │ Student Email        │ Enrollment Type         │
├──────────────────┼──────────────────────┼─────────────────────────┤
│ John Doe         │ john.doe@college.edu │ Credit                  │
│ Jane Smith       │ jane@university.edu  │ Credit for Minor        │
│ Bob Johnson      │ bob@institution.edu  │ Credit for Concentration│
└──────────────────┴──────────────────────┴─────────────────────────┘
```

---

## Upload Workflow

### Step 1: Prepare Excel File

**Option A: Modify Downloaded File**
```
1. Download file (see above)
2. Open in Excel
3. Add column: "Grade"
4. Fill grades: A, A-, B+, etc.
5. Save file

Result:
┌──────────────────┬──────────────────────┬─────────────────────────┬───────┐
│  Student Name    │ Student Email        │ Enrollment Type         │ Grade │
├──────────────────┼──────────────────────┼─────────────────────────┼───────┤
│ John Doe         │ john.doe@college.edu │ Credit                  │  A    │
│ Jane Smith       │ jane@university.edu  │ Credit for Minor        │  A-   │
│ Bob Johnson      │ bob@institution.edu  │ Credit for Concentration│  B+   │
└──────────────────┴──────────────────────┴─────────────────────────┴───────┘
```

**Option B: Create New File**
```
1. Create Excel file
2. Add headers (exact spelling):
   - Student Name
   - Student Email
   - Enrollment Type
   - Grade
3. Add student data rows
4. Save as .xlsx
```

### Step 2: Click Upload Button
```
┌─────────────────────────────────────────┐
│  Filters | [Download] [Upload Grades]  │
│                             ↑           │
│                         Click Here      │
└─────────────────────────────────────────┘
```

### Step 3: Select File
```
File Dialog Opens:
    
    │ Home > Documents > Grades
    │
    │ [📄 CSE101_Enrollments_Fall2024.xlsx] ← Select
    │ [📄 Other_File.xlsx]
    │
    │ [Cancel]  [Open]
```

### Step 4: Validation
```
System Validates:
    ✓ File format (.xlsx/.xls)
    ✓ Required columns present
    ✓ Data not empty
    ✓ Email format
    ✓ Grade field exists
    
If OK:
    → Proceeds to upload
    
If Error:
    → Shows specific error message
    → Allows retry
```

### Step 5: Upload & Process
```
Backend Processing:
    
    1. Receive file data
    2. Parse Excel rows
    3. For each row:
       - Find student by email
       - Update grade in database
       - Trigger auto-sync
    4. Collect results
    5. Return response

Progress:
    [●●●●●●○○○○] Processing...
```

### Step 6: Success Message
```
Toast Notification:
┌─────────────────────────────────────────┐
│ ✓ Grades updated for 3 student(s)      │
│                              [X]        │
└─────────────────────────────────────────┘

(Auto-refreshes enrollment list)
```

### Step 7: View Updated Grades
```
Enrollment Table Updates:
┌────────────────────────────────────────────────────────────┐
│ # │ Student           │ Type              │ Status │ Grade │
├────┼──────────────────┼──────────────────┼────────┼───────┤
│ 1 │ John Doe         │ Credit           │ Enrolled│ A     │
│ 2 │ Jane Smith       │ Credit for Minor │ Enrolled│ A-    │
│ 3 │ Bob Johnson      │ Credit for...    │ Enrolled│ B+    │
└────┴──────────────────┴──────────────────┴────────┴───────┘
```

---

## Error Scenarios & Resolutions

### Scenario 1: Missing Column Error
```
Error Message:
┌─────────────────────────────────────────────────────────┐
│ ✗ Missing columns: Grade                                │
│                                              [X]         │
└─────────────────────────────────────────────────────────┘

Cause: Excel file missing "Grade" column

Solution:
    1. Open Excel file
    2. Add column header: "Grade"
    3. Fill in grade values
    4. Save and try upload again
```

### Scenario 2: Student Not Found
```
Error Message:
┌─────────────────────────────────────────────────────────┐
│ ✓ Grades updated for 2 student(s)                       │
│ Errors: Row 3 - Student not found                       │
│                                              [X]         │
└─────────────────────────────────────────────────────────┘

Cause: Email in row 3 doesn't match any enrolled student

Solution:
    1. Download fresh enrollment list
    2. Copy student emails from it
    3. Ensure exact match (including case, spaces)
    4. Try upload again
```

### Scenario 3: Invalid File Format
```
Error Message:
┌─────────────────────────────────────────────────────────┐
│ ✗ Failed to parse Excel file                            │
│                                              [X]         │
└─────────────────────────────────────────────────────────┘

Cause: File is not valid Excel or is corrupted

Solution:
    1. Open file in Excel
    2. Verify data looks correct
    3. Save as Excel 2007+ format (.xlsx)
    4. Avoid merging cells
    5. Try upload again
```

### Scenario 4: Empty Grade Field
```
Error Message:
┌─────────────────────────────────────────────────────────┐
│ ✗ Validation errors found                               │
│ Row 2: Missing student email or grade                   │
│                                              [X]         │
└─────────────────────────────────────────────────────────┘

Cause: Row 2 has missing email or grade value

Solution:
    1. Open Excel file
    2. Go to row 2
    3. Fill in missing email or grade
    4. Try upload again
```

---

## User Interface Components

### Download Button
```
┌──────────────┐
│ ⬇ Download   │  ← Click to download enrollment list
└──────────────┘

States:
- Normal: [⬇ Download]
- Hover: Tooltip "Download enrolled students as Excel"
- Disabled: Grayed out if no students enrolled
```

### Upload Button
```
┌──────────────────────┐
│ ⬆ Upload Grades      │  ← Click to upload grades
└──────────────────────┘

States:
- Normal: [⬆ Upload Grades]
- Loading: [⟳ Upload Grades] (spinner)
- Hover: Tooltip "Upload grades from Excel"
- Disabled: Grayed out if no students enrolled
```

### Hidden File Input
```
<!-- Not visible to user, but: -->
<input 
  ref={fileInputRef}
  type="file"
  accept=".xlsx,.xls"  ← Only allows Excel files
  onChange={handleUploadExcel}
  className="hidden"
/>
```

---

## Data Flow Diagram

```
┌─────────┐
│ Browser │
│(Frontend)
└────┬────┘
     │
     ├─── Download Request ──→ [Client-Side Processing]
     │                         (No Server Needed)
     │
     └──← XLSX File ←───────── [Generate Excel with XLSX]
     │
     │
     └─── Upload File ────→ [Server API]
                           /offering/:offeringId/upload-grades
     │                      │
     │         ┌────────────┴────────────┐
     │         │                         │
     │    [Validate]              [Process]
     │     - Columns              - Parse
     │     - Data Format          - Match Students
     │                            - Update DB
     │         │                  │
     │         └────────┬─────────┘
     │                  │
     └──← Response ←─ [Return JSON]
          - Success Count
          - Error Details
          - Toast Message
```

---

## Excel File Format Reference

### Download Format (3 Columns)
```
┌──────────────────────────────────────────────────────────┐
│  A: Student Name      B: Email               C: Type     │
├──────────────────────────────────────────────────────────┤
│  John Doe            john@college.edu       Credit       │
│  Jane Smith          jane@univ.edu          Credit-Minor │
│  Bob Johnson         bob@institution.edu    Credit-Conc  │
│  [Row 4+] Empty or can continue...                      │
└──────────────────────────────────────────────────────────┘
```

### Upload Format (4 Columns)
```
┌──────────────────────────────────────────────────────────┐
│  A: Name     B: Email          C: Type      D: Grade     │
├──────────────────────────────────────────────────────────┤
│  John Doe   john@college.edu   Credit       A            │
│  Jane Smith jane@univ.edu      Credit-Minor A-           │
│  Bob J.     bob@inst.edu       Credit-Conc  B+           │
│  [Row 4+] Continue for more students...                 │
└──────────────────────────────────────────────────────────┘
```

### Important Rules
```
✓ DO:
  - Use exact column names
  - Include all required columns
  - Leave no empty rows in data
  - Use .xlsx format
  - Normalize emails (john@college.edu)

✗ DON'T:
  - Misspell column names
  - Merge cells
  - Use .xls (old format) - use .xlsx
  - Leave blank rows in middle
  - Add extra columns
  - Use special formatting
```

---

## Permission Matrix

```
┌─────────────┬──────────┬──────────┬───────────┐
│ Action      │ Student  │ Advisor  │ Instructor│ Admin
├─────────────┼──────────┼──────────┼───────────┼──────┤
│ View List   │    ✓     │    ✓     │    ✓      │  ✓   │
│ Download    │    ✗     │    ✗     │    ✓      │  ✓   │
│ Upload      │    ✗     │    ✗     │    ✓      │  ✓   │
│ Edit Grades │    ✗     │    ✗     │    ✓      │  ✓   │
│ View Grades │    ✓     │    ✓     │    ✓      │  ✓   │
└─────────────┴──────────┴──────────┴───────────┴──────┘

✓ = Allowed
✗ = Not Allowed
```

---

## Success Indicators

### When Download Works
```
✓ File downloads automatically
✓ Filename includes course code: CSE101_Enrollments_Fall2024.xlsx
✓ File opens in Excel without errors
✓ All students are listed
✓ Columns are properly sized and readable
```

### When Upload Works
```
✓ File selection dialog opens on click
✓ Toast shows: "Grades updated for X student(s)"
✓ No error messages appear
✓ Table refreshes with new grades
✓ Grades appear in enrollment table
```

---

## Time Complexity

```
Action           | Time      | Depends On
─────────────────┼───────────┼─────────────────
Download         | <100ms    | Number of students (client-side)
Parse Upload     | <200ms    | File size
Validate         | <100ms    | Number of rows
Update Grades    | 10ms/row  | Database performance
Auto Sync        | <100ms    | Trigger performance
Total Upload     | <500ms    | 1-3 seconds for 100+ students
───────────────────────────────────────────────
```

---

## Security Checklist

```
✓ Authentication Required
  - Must be logged in
  - Must be instructor or admin

✓ Role-Based Access
  - Only instructors/admins can use feature
  - Permission check on backend

✓ Input Validation
  - File type validation (.xlsx/.xls)
  - Column names validation
  - Email format validation
  - Grade field validation

✓ Data Protection
  - Parameterized queries (no SQL injection)
  - Email normalization
  - No sensitive data in errors

✓ Error Handling
  - Detailed errors for validation
  - Generic errors for security issues
  - Logging of all operations
```

---

## Common Tasks Quick Reference

### Download Grades Template
```
1. Go to Enrollments tab
2. Click Download
3. Opens Excel with student list
4. Add your grades
5. Save file
```

### Upload Single Student's Grade
```
1. Download file
2. Delete all rows except one
3. Add grade
4. Upload
5. System updates that one student
```

### Partial Grade Upload
```
1. Download file
2. Keep only students you're grading
3. Delete other rows
4. Add grades for remaining
5. Upload - only those update
```

### Fix Incorrect Grade
```
1. Download file
2. Find student
3. Change grade
4. Upload
5. System updates with new grade
```

---

## Keyboard Shortcuts

```
While in download/upload UI:
- Tab: Navigate between buttons
- Enter: Activate button
- Space: Activate button

In file dialog:
- Ctrl+O or Cmd+O: Open (OS dependent)
- Escape: Cancel
- Arrow keys: Navigate files
```

---

## Accessibility Features

```
✓ Buttons have hover tooltips
✓ Icons + text labels (not icon-only)
✓ Color contrast meets WCAG standards
✓ Error messages are descriptive
✓ File input is keyboard accessible
✓ Loading states are visible
✓ Toast notifications have text, not just icons
```

---

## Mobile Considerations

```
Download: ✓ Works on mobile
  - File downloads to device storage
  - User can open in Excel/Sheets app

Upload: ⚠ Partially supported
  - File picker works
  - May need Excel app
  - Touch-friendly buttons
  - Recommend desktop for large uploads
```

---

## Troubleshooting Flowchart

```
Issue: Can't find Download button
├─ Are you on Enrollments tab?
│  └─ No → Click Enrollments tab
│  └─ Yes ↓
├─ Are you an instructor/admin?
│  └─ No → Ask instructor to download
│  └─ Yes → Button should be visible
└─ Try refreshing page

Issue: Download doesn't work
├─ Check browser download settings
├─ Try different browser
├─ Clear browser cache
└─ Contact admin if persists

Issue: Upload fails validation
├─ Check file format (.xlsx/.xls)
├─ Verify column names
│  └─ Student Name, Student Email, Enrollment Type, Grade
├─ Check for empty rows
└─ Try again after fixes

Issue: Upload succeeds but grades don't appear
├─ Wait a moment (auto-refresh)
├─ Manually refresh page
├─ Check database was updated (ask admin)
└─ Contact admin if issue persists
```

---

**Note:** This visual guide is meant to be printed or viewed alongside the actual application for reference during use.
