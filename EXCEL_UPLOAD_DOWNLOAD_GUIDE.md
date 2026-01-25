# Excel Upload/Download Guide for Course Enrollments

## Overview
This guide explains how to use the Excel download and upload features in the Course Details page for managing student enrollments and grades.

---

## Feature 1: Download Enrollments as Excel

### What it does
Exports a list of all enrolled students for a course offering to an Excel file with the following columns:
- **Student Name**: Full name of the enrolled student
- **Student Email**: Email address of the student
- **Enrollment Type**: Type of credit (Credit, Credit for Minor, Credit for Concentration, Credit for Audit)

### How to Use
1. Navigate to the **Course Details** page for a course offering
2. Click on the **Enrollments** tab
3. Click the **Download** button (top right of the table)
4. The Excel file will download with the filename format: `{COURSE_CODE}_Enrollments_{ACADEMIC_SESSION}.xlsx`

### Example Download File
| Student Name | Student Email | Enrollment Type |
|---|---|---|
| John Doe | john.doe@college.edu | Credit |
| Jane Smith | jane.smith@college.edu | Credit for Concentration |
| Bob Johnson | bob.johnson@college.edu | Credit for Minor |

---

## Feature 2: Upload Grades from Excel

### What it does
Allows instructors to bulk upload grades for students by uploading an Excel file. The system will:
1. Parse the Excel file
2. Validate the data format and student emails
3. Match students by email address
4. Update the `grade` field in the `course_enrollment` table
5. Provide feedback on successful updates and any errors

### Required Excel Format
Your upload file **must have these exact columns** (case-sensitive):
- **Student Name**: Full name of the student
- **Student Email**: Email address of the student
- **Enrollment Type**: Type of credit enrollment
- **Grade**: The grade to be assigned (e.g., A, A-, B, B-, C, C-, etc.)

### How to Use
1. Navigate to the **Course Details** page for a course offering
2. Click on the **Enrollments** tab
3. Click the **Upload Grades** button (top right of the table)
4. Select an Excel file (.xlsx or .xls) with the required columns
5. The system will validate and update the grades
6. You'll receive a success or error message with details

### Creating the Upload File (Step by Step)

#### Option 1: Using Downloaded File
1. Download the enrollment list using the **Download** button
2. Open the file in Excel
3. Add a new column titled **Grade** with grade values
4. Save the file
5. Upload using **Upload Grades** button

#### Option 2: Manual Creation
1. Create a new Excel file
2. Create headers: **Student Name**, **Student Email**, **Enrollment Type**, **Grade**
3. Add student data rows
4. Save as .xlsx format
5. Upload using **Upload Grades** button

### Example Upload File
| Student Name | Student Email | Enrollment Type | Grade |
|---|---|---|---|
| John Doe | john.doe@college.edu | Credit | A |
| Jane Smith | jane.smith@college.edu | Credit for Concentration | A- |
| Bob Johnson | bob.johnson@college.edu | Credit for Minor | B+ |

### Valid Grade Values
Common grade formats accepted:
- Letter grades: A, B, C, D, F
- Letter grades with modifiers: A+, A-, B+, B-, C+, C-, etc.
- Numeric grades: 85, 90, 75, etc.
- Any custom grade format your institution uses (all values will be stored as-is)

---

## Database Schema

### Updated Table: `course_enrollment`
The grades are stored in the existing `course_enrollment` table:

```sql
CREATE TABLE public.course_enrollment (
  enrollment_id serial not null,
  offering_id integer not null,
  student_id integer not null,
  enrol_type character varying(50) null,
  enrol_status character varying(50) null,
  grade character varying(5) null,  -- Grade is stored here
  ...
)
```

### Trigger: Automatic Student Credit Sync
When a grade is updated, the `trigger_sync_grade_to_student_credit` trigger automatically:
- Updates the corresponding record in the `student_credit` table
- Maintains data consistency across enrollment and credit records

---

## Backend API Endpoint

### Upload Grades Endpoint
```
POST /offering/:offeringId/upload-grades
```

#### Authentication
- Requires user to be authenticated
- Requires user role to be **instructor** or **admin**

#### Request Body
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

#### Response (Success)
```json
{
  "success": true,
  "message": "Grades updated for 2 student(s)",
  "updatedCount": 2
}
```

#### Response (Partial Success with Errors)
```json
{
  "success": true,
  "message": "Grades updated for 1 student(s)",
  "updatedCount": 1,
  "errors": [
    "Row 2: Student with email jane.smith@invalid.edu not found"
  ]
}
```

#### Response (Validation Error)
```json
{
  "success": false,
  "message": "Validation errors found",
  "errors": [
    "Row 1: Missing student email or grade",
    "Row 3: Missing student email or grade"
  ]
}
```

---

## Error Handling & Troubleshooting

### Common Errors and Solutions

#### Error: "Missing columns: Student Name, Student Email, Enrollment Type, Grade"
**Cause**: Excel file doesn't have the required columns
**Solution**: Ensure your file has exactly these column headers (case-sensitive)

#### Error: "Student with email XXX not found"
**Cause**: The email in the Excel file doesn't match any student in the database
**Solution**: 
- Verify the student email is correct
- Check that the student is actually enrolled in the system
- Ensure there are no typos or extra spaces

#### Error: "Failed to parse Excel file"
**Cause**: The file format is not valid or corrupted
**Solution**: 
- Ensure the file is a valid .xlsx or .xls file
- Try saving the file again in Excel
- Avoid special characters in file names

#### Error: "Failed to update grades"
**Cause**: Database error when updating records
**Solution**: 
- Contact the system administrator
- Check that the offering ID is valid
- Verify you have permission to update grades

### File Format Tips
- Use Excel 2007+ format (.xlsx) for best compatibility
- Avoid merged cells or formatted tables
- Keep data in simple rows without extra formatting
- Don't include empty rows in the middle of data
- Ensure student emails match exactly (case doesn't matter, but whitespace does)

---

## Frontend Implementation Details

### Libraries Used
- **XLSX** (SheetJS): For Excel file generation and parsing
- **React Hot Toast**: For success/error notifications
- **Lucide React**: For UI icons (Download, Upload)

### Component: CourseDetailsPage
Location: `/frontend/src/pages/CourseDetailsPage.jsx`

#### Key Functions
1. **handleDownloadExcel()**: Generates and downloads Excel file
2. **handleUploadExcel()**: Handles file input and upload

#### State Variables
```javascript
const [uploadLoading, setUploadLoading] = useState(false);
const fileInputRef = useRef(null);
```

---

## Backend Implementation Details

### Controller Function
Location: `/backend/controllers/aimsController.js`

#### Function: uploadGrades()
- Validates request parameters
- Parses grade entries
- Maps student emails to student IDs
- Updates grades in course_enrollment table
- Returns success/error feedback

### Route
Location: `/backend/routes/AimsRoutes.js`

```javascript
router.post('/offering/:offeringId/upload-grades', requireAuth, requireRole('instructor'), uploadGrades);
```

---

## Security & Permissions

### Who Can Access?
- **Download**: Instructors and Admins (assigned to the offering)
- **Upload**: Instructors and Admins (assigned to the offering)

### Validation
- Email addresses are normalized (lowercase, trimmed)
- Grades are validated before database update
- Only authenticated users can access endpoints
- Role-based access control enforced

---

## Performance Notes
- Downloads are generated client-side (no server processing needed)
- Uploads process up to the entire enrollment list in one batch
- Database updates use direct SQL queries for efficiency
- No intermediate temporary files are created

---

## Support & Troubleshooting
If you encounter issues:
1. Check the error message displayed
2. Verify your Excel file format matches the requirements
3. Ensure student emails are correct and registered in the system
4. Check that you have instructor/admin permissions for the course
5. Contact your system administrator if problems persist

---

## FAQ

**Q: Can I upload grades for students not enrolled in the course?**
A: No, the system will skip any students not found in the database for that course offering.

**Q: What happens if a student appears multiple times in the upload?**
A: Only the first occurrence will be processed; subsequent duplicates will be ignored.

**Q: Can I partially update grades (some students only)?**
A: Yes, you can upload a file with only the students you want to update grades for.

**Q: How do I bulk download grades?**
A: Currently, you can download the enrollment list, fill in grades manually, and re-upload.

**Q: Are grades immediately visible to students?**
A: Grades are updated in the system immediately. Visibility to students depends on your course settings.

**Q: Can I undo a grade upload?**
A: There's no automated undo feature. You'll need to manually revert grades or contact an administrator.
