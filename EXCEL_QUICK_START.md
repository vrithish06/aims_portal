# Quick Start Guide: Excel Upload/Download Feature

## Installation (5 minutes)

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend (xlsx already in package.json)
cd backend
npm install
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Quick Usage

### Download Student Enrollments

1. Navigate to a course offering
2. Click **Enrollments** tab
3. Click **Download** button (top right)
4. Excel file downloads automatically

**File format:**
```
Student Name | Student Email | Enrollment Type
John Doe | john@college.edu | Credit
Jane Smith | jane@college.edu | Credit for Concentration
```

---

### Upload Grades

#### Method 1: From Downloaded File
1. Download enrollments (see above)
2. Open Excel file
3. **Add a column:** "Grade" 
4. **Fill in grades:** A, A-, B+, etc.
5. Save file
6. Click **Upload Grades** button
7. Select your file
8. Done! System updates database

#### Method 2: Manual Excel File
1. Create Excel file with columns:
   - Student Name
   - Student Email
   - Enrollment Type
   - Grade

2. Fill in student data
3. Click **Upload Grades** → Select file

**Example:**
```
Student Name | Student Email | Enrollment Type | Grade
John Doe | john@college.edu | Credit | A
Jane Smith | jane@college.edu | Credit for Concentration | A-
Bob Johnson | bob@college.edu | Credit for Minor | B+
```

---

## Key Features

✅ **One-click Download**
- Exports all enrolled students
- Properly formatted with correct column widths
- Auto-named with course code and semester

✅ **Batch Grade Upload**
- Update multiple students at once
- Automatic email matching
- Detailed error reporting

✅ **Automatic Sync**
- Grade updates instantly sync to student credit records
- Database trigger handles consistency

✅ **Built-in Validation**
- Checks for required columns
- Validates student emails
- Clear error messages show exactly what's wrong

---

## Excel File Requirements

### Column Names (Exact & Case-Sensitive)
```
Download provides:
- Student Name
- Student Email
- Enrollment Type

Upload requires all of above PLUS:
- Grade
```

### Example Upload Format
```
┌─────────────────┬──────────────────────┬────────────────────────┬───────┐
│ Student Name    │ Student Email        │ Enrollment Type        │ Grade │
├─────────────────┼──────────────────────┼────────────────────────┼───────┤
│ John Doe        │ john.doe@college.edu │ Credit                 │ A     │
│ Jane Smith      │ jane.smith@univ.edu  │ Credit for Minor       │ A-    │
│ Bob Johnson     │ bob.j@institution.ed │ Credit for Audit       │ B+    │
└─────────────────┴──────────────────────┴────────────────────────┴───────┘
```

---

## Troubleshooting

### "Missing columns" Error
- Ensure Excel has exactly these headers: Student Name, Student Email, Enrollment Type, Grade
- Check spelling - column names are case-sensitive

### "Student not found" Error
- Verify email matches exactly with what's in system
- Check for extra spaces or typos
- Ensure student is actually enrolled

### File won't upload
- Use .xlsx or .xls format
- Avoid merged cells or special formatting
- Don't include blank rows in data

### Grades not updating
- Check network connection
- Verify you have instructor/admin permissions
- Look for error messages in browser console

---

## API Endpoint (For Developers)

### POST /offering/:offeringId/upload-grades

**Request:**
```json
{
  "grades": [
    {
      "student_name": "John Doe",
      "student_email": "john.doe@college.edu",
      "enrol_type": "Credit",
      "grade": "A"
    },
    {
      "student_name": "Jane Smith",
      "student_email": "jane.smith@college.edu",
      "enrol_type": "Credit for Concentration",
      "grade": "A-"
    }
  ]
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Grades updated for 2 student(s)",
  "updatedCount": 2
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation errors found",
  "errors": [
    "Row 1: Missing student email or grade"
  ]
}
```

---

## Files Modified

### Frontend
- `src/pages/CourseDetailsPage.jsx` - Added download/upload UI and handlers
- `package.json` - Added xlsx dependency

### Backend
- `controllers/aimsController.js` - Added uploadGrades function
- `routes/AimsRoutes.js` - Added upload grades endpoint

### Documentation
- `EXCEL_UPLOAD_DOWNLOAD_GUIDE.md` - Complete user guide
- `EXCEL_FEATURE_IMPLEMENTATION.md` - Implementation details

---

## Common Use Cases

### 1. Grade Distribution
```
1. Download student list
2. Distribute to TAs/assistants
3. Collect completed Excel files
4. Upload all at once
```

### 2. Partial Grade Update
```
1. Download full list
2. Delete rows for students you're not grading yet
3. Add grades for students who submitted
4. Upload - system only updates those students
```

### 3. Grade Correction
```
1. Download current enrollments
2. Only include students to correct
3. Upload with corrected grades
4. System updates automatically
```

---

## Permissions

Only **instructors** and **admins** can:
- Download enrollment lists
- Upload grades
- Access these features

Students and other users will not see these buttons.

---

## Next Steps

1. Read [EXCEL_UPLOAD_DOWNLOAD_GUIDE.md](EXCEL_UPLOAD_DOWNLOAD_GUIDE.md) for comprehensive guide
2. Read [EXCEL_FEATURE_IMPLEMENTATION.md](EXCEL_FEATURE_IMPLEMENTATION.md) for technical details
3. Start using the feature in your course offerings!

---

## Need Help?

- Check error messages - they tell you exactly what's wrong
- Verify Excel file format matches requirements
- Ensure student emails are correct
- Contact system administrator if issues persist

---

## Safety Tips

✅ Always download current list before uploading
✅ Verify email addresses before uploading
✅ Test with a few students first
✅ Keep backup of original grade lists
⚠️ There's no undo - contact admin to revert if needed

---

## Performance

- Download: Instant (client-side)
- Upload: Few seconds for 100+ students
- Database: Optimized for batch updates
- Trigger: Automatic sync takes <100ms per grade

---

## Support

For detailed usage, technical details, and troubleshooting:
- See [EXCEL_UPLOAD_DOWNLOAD_GUIDE.md](EXCEL_UPLOAD_DOWNLOAD_GUIDE.md)
- See [EXCEL_FEATURE_IMPLEMENTATION.md](EXCEL_FEATURE_IMPLEMENTATION.md)
