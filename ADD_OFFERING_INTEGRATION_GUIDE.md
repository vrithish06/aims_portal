# AddOfferingPage Integration Guide

## Integration Steps

### 1. Update App.jsx Routes

Add this route to your App.jsx file (likely in your route definitions):

```jsx
import AddOfferingPage from './pages/AddOfferingPage';

// In your route definitions (usually inside a Routes component):
<Route path="/add-offering" element={<ProtectedRoute><AddOfferingPage /></ProtectedRoute>} />
```

### 2. Add Navigation Link

Add a link to create new offerings in your navigation or offerings page:

```jsx
// In MyOfferingsPage.jsx or similar:
<button
  onClick={() => navigate('/add-offering')}
  className="btn btn-primary"
>
  + Create New Offering
</button>
```

### 3. Role-Based Access

The page is automatically protected by:
- Frontend: `ProtectedRoute` component checks authentication
- Backend: `requireRole('instructor')` middleware ensures only instructors/admins can create offerings

## Testing the Implementation

### Backend Testing (Using Postman/curl)

1. **Search Courses**
```bash
curl "http://localhost:5000/api/courses/search?code=CS" \
  -H "Content-Type: application/json"
```

2. **Get Instructors**
```bash
curl "http://localhost:5000/api/instructors/all" \
  -H "Content-Type: application/json" \
  -H "Cookie: aims.sid=<session_id>"
```

3. **Create Offering**
```bash
curl -X POST "http://localhost:5000/api/offering/create-with-instructors" \
  -H "Content-Type: application/json" \
  -H "Cookie: aims.sid=<session_id>" \
  -d '{
    "course_id": 1,
    "acad_session": "Fall 2024",
    "status": "Enrolling",
    "slot": "A1",
    "section": "1",
    "instructors": [
      {"instructor_id": 1, "is_coordinator": true},
      {"instructor_id": 2, "is_coordinator": false}
    ]
  }'
```

### Frontend Testing

1. Login as instructor
2. Navigate to `/add-offering`
3. Test course search functionality
4. Add instructors and toggle coordinator
5. Submit form
6. Verify success message and redirect

## Common Issues & Solutions

### Issue: Instructor dropdown shows "No instructors available"
**Solution**: Ensure instructors are created in the `instructor` table and linked to users. Check that the `user_id` foreign key is properly set.

### Issue: "Exactly one instructor must be marked as coordinator" error
**Solution**: Make sure you toggle at least one instructor to be coordinator. The system enforces this constraint.

### Issue: Course search returns no results
**Solution**: 
- Verify courses exist in database with `is_deleted = false`
- Check that the course code search is case-insensitive (should work)
- Try a longer wait for the search to complete

### Issue: API returns 403 Forbidden
**Solution**: Ensure the authenticated user has the "instructor" role. Only instructors can create offerings. Admins can also create them.

## Data Model Verification

Before using, ensure your database has these tables properly set up:

```sql
-- Verify course table
SELECT COUNT(*) FROM course WHERE is_deleted = false;

-- Verify instructor table has users relationship
SELECT i.instructor_id, i.user_id, u.email, u.first_name, u.last_name 
FROM instructor i 
JOIN users u ON i.user_id = u.id 
WHERE i.is_deleted = false;

-- Check course_offering table structure
SELECT * FROM course_offering LIMIT 1;

-- Check course_offering_instructor junction table
SELECT * FROM course_offering_instructor LIMIT 1;
```

## Customization Options

### Change Default Status
In AddOfferingPage.jsx, change:
```jsx
const [status, setStatus] = useState("Enrolling");
```

### Add More Status Options
In AddOfferingPage.jsx, update the select options:
```jsx
<select value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="Enrolling">Enrolling</option>
  <option value="Running">Running</option>
  <option value="Completed">Completed</option>
  <option value="Cancelled">Cancelled</option>
  <option value="Your New Status">Your New Status</option>
</select>
```

### Customize Instructor Display
In AddOfferingPage.jsx, modify the instructor card display:
```jsx
// Around line 350, in the instructor display section
<div>
  <div className="font-medium text-gray-900">
    {instructor.name}
  </div>
  <div className="text-sm text-gray-600">
    {instructor.email}
  </div>
  {/* Add more fields here if needed */}
</div>
```

## Additional Notes

- All timestamps and deleted flags are handled automatically
- The system prevents duplicate instructor assignments (same offering + instructor combo)
- Coordinator status can be changed after selection by toggling the button
- The search is real-time but debounced through user input delay
- All API calls include proper error handling and user feedback
