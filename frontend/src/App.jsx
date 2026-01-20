import { useEffect } from 'react'
import Navbar from "./components/Navbar";
import ProductPage from "./pages/ProductPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import EnrolledCoursesPage from "./pages/EnrolledCoursesPage";
import CourseOfferingsPage from "./pages/CourseOfferingsPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import StudentRecordPage from "./pages/StudentRecordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import useAuthStore from "./store/authStore";

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
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </div>
  )
};

export default App;