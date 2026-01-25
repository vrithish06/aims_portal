# Excel Feature - Code Examples & Reference

## Frontend Code Examples

### 1. Download Excel Function

```javascript
const handleDownloadExcel = () => {
  try {
    // Prepare data for Excel
    const data = enrolledStudents.map((s) => ({
      "Student Name": s.student_name,
      "Student Email": s.student_email,
      "Enrollment Type": s.enrol_type,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrollments");

    // Set column widths for better formatting
    worksheet["!cols"] = [
      { wch: 25 }, // Student Name
      { wch: 30 }, // Student Email
      { wch: 25 }, // Enrollment Type
    ];

    // Download file with meaningful name
    XLSX.writeFile(
      workbook,
      `${course?.code || "Course"}_Enrollments_${offering.acad_session || "Session"}.xlsx`
    );

    toast.success("Excel file downloaded");
  } catch (err) {
    toast.error("Failed to download Excel");
  }
};
```

### 2. Upload Excel Function

```javascript
const handleUploadExcel = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setUploadLoading(true);
    
    // Read Excel file
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Parse Excel workbook
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate data
        if (!jsonData || jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        // Check required columns
        const requiredColumns = ["Student Name", "Student Email", "Enrollment Type", "Grade"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast.error(`Missing columns: ${missingColumns.join(", ")}`);
          return;
        }

        // Transform data for API
        const gradesData = jsonData.map((row) => ({
          student_name: row["Student Name"],
          student_email: row["Student Email"],
          enrol_type: row["Enrollment Type"],
          grade: row["Grade"],
        }));

        // Send to backend
        const response = await axiosClient.post(
          `/offering/${offeringId}/upload-grades`,
          { grades: gradesData }
        );

        if (response.data.success) {
          toast.success(`Grades updated for ${response.data.updatedCount} student(s)`);
          // Refresh the enrollments list
          fetchEnrolledStudents();
        } else {
          toast.error(response.data.message || "Failed to update grades");
        }
      } catch (parseErr) {
        toast.error("Failed to parse Excel file");
      }
    };

    reader.readAsBinaryString(file);
  } catch (err) {
    toast.error("Failed to process file");
  } finally {
    setUploadLoading(false);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};
```

### 3. UI Buttons

```jsx
{isTeacherOrAdmin && filteredStudents.length > 0 && (
  <div className="flex gap-2">
    {/* Download Button */}
    <button
      onClick={handleDownloadExcel}
      className="btn btn-outline btn-sm gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
      title="Download enrolled students as Excel"
    >
      <Download className="w-4 h-4" />
      Download
    </button>

    {/* Upload Button */}
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={uploadLoading}
      className="btn btn-outline btn-sm gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
      title="Upload grades from Excel"
    >
      {uploadLoading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <>
          <Upload className="w-4 h-4" />
          Upload Grades
        </>
      )}
    </button>

    {/* Hidden File Input */}
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls"
      onChange={handleUploadExcel}
      className="hidden"
    />
  </div>
)}
```

---

## Backend Code Examples

### 1. Complete uploadGrades Controller Function

```javascript
export const uploadGrades = async (req, res) => {
  try {
    const { offeringId } = req.params;
    const { grades } = req.body;

    // Validate input
    if (!offeringId || !grades || !Array.isArray(grades)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: offeringId and grades array required'
      });
    }

    console.log(`[UPLOAD-GRADES] Processing ${grades.length} grade records for offering ${offeringId}`);

    // Step 1: Validate each grade entry
    const gradeUpdates = [];
    const errors = [];

    for (let i = 0; i < grades.length; i++) {
      const gradeEntry = grades[i];
      const { student_email, grade } = gradeEntry;

      // Check for required fields
      if (!student_email || !grade) {
        errors.push(`Row ${i + 1}: Missing student email or grade`);
        continue;
      }

      // Normalize email for matching
      gradeUpdates.push({
        student_email: student_email.trim().toLowerCase(),
        grade: grade.trim().toUpperCase(),
        rowIndex: i + 1
      });
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors
      });
    }

    // Step 2: Get student IDs from emails
    const emails = gradeUpdates.map(g => g.student_email);
    const { data: students, error: studentError } = await supabase
      .from('student')
      .select('student_id, user_id, users(email)')
      .in('email', emails);

    if (studentError) throw studentError;

    // Create email -> student_id map
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.users.email.toLowerCase()] = s.student_id;
    });

    // Step 3: Update grades in course_enrollment table
    let updatedCount = 0;
    const updateErrors = [];

    for (const gradeUpdate of gradeUpdates) {
      const studentId = studentMap[gradeUpdate.student_email];

      // Check if student found
      if (!studentId) {
        updateErrors.push(`Row ${gradeUpdate.rowIndex}: Student with email ${gradeUpdate.student_email} not found`);
        continue;
      }

      // Update grade in database
      const { error: updateError } = await supabase
        .from('course_enrollment')
        .update({ grade: gradeUpdate.grade })
        .match({
          offering_id: parseInt(offeringId),
          student_id: studentId
        });

      if (updateError) {
        updateErrors.push(`Row ${gradeUpdate.rowIndex}: Failed to update grade - ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }

    console.log(`[UPLOAD-GRADES] Updated ${updatedCount} grades successfully`);

    // Return response
    return res.status(200).json({
      success: true,
      message: `Grades updated for ${updatedCount} student(s)`,
      updatedCount,
      errors: updateErrors.length > 0 ? updateErrors : undefined
    });

  } catch (err) {
    console.error("[UPLOAD-GRADES] Error:", err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload grades: ' + err.message
    });
  }
};
```

### 2. Route Definition

```javascript
// Add to imports
import { uploadGrades } from '../controllers/aimsController.js';

// Add route
router.post(
  '/offering/:offeringId/upload-grades',
  requireAuth,
  requireRole('instructor'),
  uploadGrades
);
```

---

## API Request/Response Examples

### Upload Grades Request

```javascript
// JavaScript/Axios Example
const gradesData = [
  {
    student_name: "John Doe",
    student_email: "john.doe@college.edu",
    enrol_type: "Credit",
    grade: "A"
  },
  {
    student_name: "Jane Smith",
    student_email: "jane.smith@college.edu",
    enrol_type: "Credit for Concentration",
    grade: "A-"
  }
];

const response = await axiosClient.post(
  `/offering/123/upload-grades`,
  { grades: gradesData }
);
```

### Successful Response

```json
{
  "success": true,
  "message": "Grades updated for 2 student(s)",
  "updatedCount": 2
}
```

### Response with Errors

```json
{
  "success": true,
  "message": "Grades updated for 1 student(s)",
  "updatedCount": 1,
  "errors": [
    "Row 2: Student with email jane.smith@invalid.edu not found",
    "Row 3: Failed to update grade - Database error"
  ]
}
```

### Validation Error Response

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

## Database Operations

### Grade Update Query

```sql
-- Single grade update (handled by Supabase JS SDK)
UPDATE course_enrollment 
SET grade = 'A' 
WHERE offering_id = 123 
AND student_id = 456;

-- Result: Triggers automatic sync via trigger_sync_grade_to_student_credit
```

### Automatic Sync via Trigger

```sql
CREATE TRIGGER trigger_sync_grade_to_student_credit
AFTER UPDATE OF grade ON course_enrollment 
FOR EACH ROW 
WHEN (old.grade::text is distinct from new.grade::text)
EXECUTE FUNCTION sync_grade_to_student_credit();

-- This automatically updates student_credit table when grades change
```

---

## XLSX Library Usage

### Install XLSX

```bash
# Frontend
npm install xlsx

# Backend
npm install xlsx
```

### Import in React

```javascript
import * as XLSX from "xlsx";
```

### Create Excel File

```javascript
// Create data array
const data = [
  { Name: "John", Email: "john@example.com" },
  { Name: "Jane", Email: "jane@example.com" }
];

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(data);

// Create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

// Download
XLSX.writeFile(workbook, "filename.xlsx");
```

### Read Excel File

```javascript
const reader = new FileReader();

reader.onload = (event) => {
  // Read file
  const binaryStr = event.target.result;
  const workbook = XLSX.read(binaryStr, { type: "binary" });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(jsonData);
};

reader.readAsBinaryString(file);
```

### Set Column Widths

```javascript
const worksheet = XLSX.utils.json_to_sheet(data);

// Set widths (in characters)
worksheet["!cols"] = [
  { wch: 20 }, // Column A
  { wch: 30 }, // Column B
  { wch: 25 }, // Column C
];
```

---

## Error Handling Examples

### Frontend Error Handling

```javascript
try {
  // Attempt upload
  const response = await axiosClient.post(endpoint, data);
  
  if (response.data.success) {
    // Success handling
    const { updatedCount, errors } = response.data;
    
    if (errors && errors.length > 0) {
      // Partial success with errors
      console.warn("Errors:", errors);
      toast.warning(`Updated ${updatedCount}, but ${errors.length} failed`);
    } else {
      // Complete success
      toast.success(`Successfully updated ${updatedCount} grades`);
    }
  } else {
    // API returned failure
    toast.error(response.data.message);
  }
} catch (error) {
  // Network or other error
  toast.error("Failed to upload: " + error.message);
}
```

### Backend Error Handling

```javascript
// Validation error (400)
if (!validData) {
  return res.status(400).json({
    success: false,
    message: 'Invalid data',
    errors: validationErrors
  });
}

// Not found error (404)
if (!offering) {
  return res.status(404).json({
    success: false,
    message: 'Offering not found'
  });
}

// Database error (500)
if (dbError) {
  return res.status(500).json({
    success: false,
    message: 'Database error: ' + dbError.message
  });
}
```

---

## Testing Examples

### Test Download
```javascript
// Click download button
fireEvent.click(downloadButton);

// Verify file was created
expect(XLSX.writeFile).toHaveBeenCalledWith(
  expect.any(Object),
  expect.stringMatching(/Enrollments/)
);
```

### Test Upload
```javascript
// Create test file
const file = new File(
  [/* Excel data */],
  "test.xlsx",
  { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
);

// Simulate file input
fileInput.files = [file];
fireEvent.change(fileInput);

// Verify API was called
expect(axiosClient.post).toHaveBeenCalledWith(
  expect.stringMatching(/upload-grades/),
  expect.any(Object)
);
```

---

## Debugging Tips

### Enable Logging

```javascript
// Frontend
console.log("Upload data:", gradesData);
console.log("Excel file:", file);

// Backend
console.log(`[UPLOAD-GRADES] Processing ${grades.length} records`);
console.log(`[UPLOAD-GRADES] Student map:`, studentMap);
```

### Inspect Excel Data

```javascript
const workbook = XLSX.read(binaryStr, { type: "binary" });
console.log("Sheet names:", workbook.SheetNames);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
console.log("Parsed data:", jsonData);
```

### Test Student Lookup

```javascript
// Verify students can be found
const testEmail = "john.doe@college.edu";
const { data: students } = await supabase
  .from('student')
  .select('*')
  .eq('email', testEmail);

console.log("Found students:", students);
```

---

## Performance Optimization

### Batch Updates
```javascript
// Current: Updates one by one
for (const gradeUpdate of gradeUpdates) {
  await supabase.from('course_enrollment').update(...);
}

// Could optimize to batch later:
const updates = gradeUpdates.map(gu => supabase.from('course_enrollment').update(...));
await Promise.all(updates);
```

### Caching Student Map
```javascript
// Current: Fetches once per upload
const students = await supabase.from('student').select(...);

// Could add caching for repeated uploads:
const cache = {};
if (!cache[offeringId]) {
  cache[offeringId] = await supabase.from('student').select(...);
}
```

---

## Security Considerations

### Input Validation
```javascript
// Validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate grade format (customize per institution)
const isValidGrade = (grade) => {
  return /^[A-F][+-]?$|^[0-9]{2,3}$/.test(grade);
};
```

### Authorization Check
```javascript
// Route middleware
requireAuth, // User must be logged in
requireRole('instructor'), // User must be instructor or admin

// Controller check (optional additional validation)
if (!isOfferingInstructor) {
  return res.status(403).json({ success: false, message: 'Forbidden' });
}
```

### Data Sanitization
```javascript
// Normalize inputs
const email = gradeEntry.student_email?.trim().toLowerCase();
const grade = gradeEntry.grade?.trim().toUpperCase();

// Prevent SQL injection (Supabase uses parameterized queries)
// So input is automatically escaped
```

---

## Additional Resources

- XLSX Documentation: https://sheetjs.com/
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- React File Input: https://react.dev/reference/react-dom/components/input
- Axios Documentation: https://axios-http.com/

