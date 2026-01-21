import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { BookOpen, User, Mail } from "lucide-react";

function StudentRecordPage() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    fetchStudentRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchStudentRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Fetch student details
      const studentRes = await axiosClient.get("/student/me");

      if (studentRes.data?.success) {
        setStudentInfo(studentRes.data.data);
      } else {
        throw new Error("Failed to fetch student info");
      }

      // ✅ Fetch enrolled courses
      const coursesRes = await axiosClient.get("/student/enrolled-courses");

      if (coursesRes.data?.success) {
        setEnrolledCourses(coursesRes.data.data || []);
      } else {
        setEnrolledCourses([]);
      }
    } catch (err) {
      console.error("Error fetching student record:", err);

      if (!err.response) {
        setError("Backend not reachable. Please try again later.");
      } else if (err.response.status === 401) {
        // Session expired → handled globally by axios interceptor
        navigate("/login", { replace: true });
      } else {
        setError("Failed to load student record");
      }

      setStudentInfo(null);
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return "text-gray-600";
    const gradeMap = {
      A: "text-green-600",
      B: "text-blue-600",
      C: "text-yellow-600",
      D: "text-orange-600",
      F: "text-red-600",
    };
    return gradeMap[grade.charAt(0)] || "text-gray-600";
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "enrolled":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "dropped":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-xl">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Student Record
        </h1>
        <p className="text-lg text-gray-600">
          Complete academic record and course history
        </p>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Student Details */}
          {studentInfo && (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-200">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Student Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Full Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {studentInfo.users?.first_name}{" "}
                    {studentInfo.users?.last_name}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Email
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-gray-900">
                      {studentInfo.users?.email ||
                        studentInfo.email ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                  <p className="text-xs font-semibold text-blue-700 mb-2">
                    CGPA
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {studentInfo.cgpa?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Course Records */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-200">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Course Records
              </h2>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No course records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledCourses.map((enrollment, idx) => (
                      <tr
                        key={enrollment.enrollment_id}
                        className="border-b border-gray-200 hover:bg-blue-50"
                      >
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {enrollment.course_offering?.course?.code ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {enrollment.course_offering?.course?.title ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusColor(
                              enrollment.enrol_status
                            )}`}
                          >
                            {enrollment.enrol_status || "Unknown"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold ${getGradeColor(
                            enrollment.grade
                          )}`}
                        >
                          {enrollment.grade || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentRecordPage;
