# AIMS Portal – DEP Project

The **AIMS Portal** is a web-based academic management system designed to simplify and streamline academic workflows for **students, instructors, advisors, and administrators**.

It manages and eases everyday academic activities such as **course offerings, course enrollments, approvals, grading, alerts, and administrative operations**, all in one unified platform.

This project was developed as part of a **DEP (Design Engineering Project)**.

### Stake Holders
- Student
- Instructor
- Faculty Advisor
- Admin
---

## Key Features

###  Academic Management
- Complete **course offering lifecycle** (propose → enroll → run → complete)
- **Course enrollment lifecycle** with instructor and advisor approvals
- Automatic **CGPA and credit calculation**
- **Eligibility-based enrollment visibility** (e.g., Credit for Minor shown only to eligible students)


###  Filtering & Search
- Advanced **filtering and search** across courses, enrollments, users, and tasks  

###  Bulk Actions
- Bulk **uploading of grades**
- Bulk **user creation**
- Downloadable **Excel templates** for easy editing and re-upload
- Bulk **approval / rejection** workflows
- Session-level **course management** (e.g., changing the status of all courses in a session with one click when deadlines are met)  


###  Alerts & Notifications
- Centralized **alert system** to notify users about deadlines and important updates  
- Reduces dependency on emails and helps users stay on track  


###  Enrollment Intelligence
- Displays **only valid enrollment types** based on course targets and student eligibility  


###  Secure Login with Email OTP
- **Email-based OTP authentication** provides an extra layer of security and prevents unauthorized access.

###  My Work / Pending Works
- Unified dashboard for **instructor and advisor tasks**
- Advisors can track all pending actions in one place
- Supports **bulk actions** and **filters** for faster processing

###  Timetable Clash Warnings
- Real-time **timetable clash detection**
- Warns students during course selection to avoid scheduling conflicts

---

##  How to Run Locally

###  Clone the Repository
```bash
git clone https://github.com/vrithish06/aims_portal
```
### Navigate to the project directory
```bash
cd aims-portal
```
### Start the backend server
```bash
cd backend
npm install
npm run dev
```
## Start the frontend server
```bash 
cd frontend
npm install
npm run dev
```

