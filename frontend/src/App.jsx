import { useEffect } from 'react'
import Navbar from "./components/Navbar";
import ProductPage from "./pages/ProductPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import EnrolledCoursesPage from "./pages/EnrolledCoursesPage";
import CourseOfferingsPage from "./pages/CourseOfferingsPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import StudentRecordPage from "./pages/StudentRecordPage";
import CourseAddPage from "./pages/CourseAddPage";
import AddOfferingPage from "./pages/AddOfferingPage"
import MyOfferingsPage from "./pages/MyOfferingsPage";
import AddUserPage from "./pages/AddUserPage";
import ActionPendingPage from "./pages/ActionPendingPage";
import AdvisorActionsPage from "./pages/AdvisorActionsPage";
import FacultyAdviseesPage from "./pages/FacultyAdviseesPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AlertsPage from "./pages/AlertsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import useAuthStore from "./store/authStore";
import StudentAdvisorDetailPage from './pages/StudentAdvisorDetailPage';
import MyPendingWorksPage from './pages/MyPendingWorksPage';



function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    console.log('Initializing auth...')
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user })
  }, [isAuthenticated, user])

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/enrolled-courses" element={<ProtectedRoute><EnrolledCoursesPage /></ProtectedRoute>} />
        <Route path="/course-offerings" element={<ProtectedRoute><CourseOfferingsPage /></ProtectedRoute>} />
        <Route path="/student-record" element={<ProtectedRoute><StudentRecordPage /></ProtectedRoute>} />
        <Route path="/course/:offeringId" element={<ProtectedRoute><CourseDetailsPage /></ProtectedRoute>} />
        <Route path="/course-add" element={<ProtectedRoute><CourseAddPage /></ProtectedRoute>} />
        <Route path="/add-offering" element={<ProtectedRoute><AddOfferingPage /></ProtectedRoute>} />
        <Route path="/my-offerings" element={<ProtectedRoute><MyOfferingsPage /></ProtectedRoute>} />
        <Route path="/action-pending" element={<ProtectedRoute><ActionPendingPage /></ProtectedRoute>} />
        <Route path="/action-pending/:offeringId" element={<ProtectedRoute><ActionPendingPage /></ProtectedRoute>} />
        <Route path="/advisor-actions" element={<ProtectedRoute><AdvisorActionsPage /></ProtectedRoute>} />
        <Route path="/my-pending-works" element={<ProtectedRoute><MyPendingWorksPage /></ProtectedRoute>} />
        <Route path="/advisor-actions/:studentId" element={<ProtectedRoute><AdvisorActionsPage /></ProtectedRoute>} />
        <Route path="/faculty-advisees" element={<ProtectedRoute><FacultyAdviseesPage /></ProtectedRoute>} />
        <Route path="/admin-alerts" element={<ProtectedRoute><AdminAlertsPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/add-user" element={<ProtectedRoute><AddUserPage /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/faculty-advisees/:studentId" element={<StudentAdvisorDetailPage />} />
      </Routes>
    </div>
  )
};

export default App;