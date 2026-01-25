import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { Users, Mail, BookOpen, Calendar } from "lucide-react";

export default function MyAdviseesPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [advisees, setAdvisees] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "instructor") {
      navigate("/");
      return;
    }
    fetchAdvisees();
  }, [isAuthenticated, user, navigate]);

  const fetchAdvisees = async () => {
    try {
      setLoading(true);
      // Fetch advisees using the dedicated endpoint that handles advisor logic
      const response = await axiosClient.get('/enrollment/advisees');
      
      console.log("Advisees response:", response.data);
      setAdvisees(response.data.data || []);
    } catch (err) {
      console.error("Error fetching advisees:", err);
      // If error, show empty list
      setAdvisees([]);
    } finally {
      setLoading(false);
    }
  };

  const viewStudentEnrollments = async (student) => {
    setSelectedStudent(student);
    
    // The enrollments are already included in the student data from the API
    // Just extract them from the student object
    if (student.enrollments && student.enrollments.length > 0) {
      setEnrollments(student.enrollments);
    } else {
      setEnrollments([]);
    }
  };

  if (!isAuthenticated || user?.role !== "instructor") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Only instructors with advisor role can view this page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">My Advisees</h1>
          </div>
          <p className="text-gray-600">Manage and view information about your assigned advisees</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-blue-600"></div>
          </div>
        )}

        {/* No Advisees */}
        {!loading && advisees.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              You don't have any assigned advisees yet
            </p>
          </div>
        )}

        {/* Advisees Grid */}
        {!loading && advisees.length > 0 && !selectedStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisees.map((student) => (
              <div
                key={student.student_id}
                onClick={() => viewStudentEnrollments(student)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                      <span className="font-bold text-sm">
                        {student.users?.first_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {student.users?.first_name} {student.users?.last_name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600 truncate">{student.email}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-gray-700">Degree:</span>{" "}
                      <span className="text-gray-600">{student.degree}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Branch:</span>{" "}
                      <span className="text-gray-600">{student.branch}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Batch:</span>{" "}
                      <span className="text-gray-600">{student.batch}</span>
                    </p>
                  </div>

                  <button className="w-full btn btn-sm btn-primary text-white">
                    View Enrollments
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Student Enrollments */}
        {selectedStudent && (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedStudent(null);
                setEnrollments([]);
              }}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Advisees
            </button>

            {/* Student Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedStudent.users?.first_name} {selectedStudent.users?.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Degree</p>
                  <p className="text-gray-600">{selectedStudent.degree}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Branch</p>
                  <p className="text-gray-600">{selectedStudent.branch}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Batch</p>
                  <p className="text-gray-600">{selectedStudent.batch}</p>
                </div>
              </div>
            </div>

            {/* Enrollments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-800">Enrollments</h3>
              </div>

              {enrollments.length === 0 && (
                <p className="text-gray-500 text-center py-8">No enrollments found</p>
              )}

              {enrollments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Session</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.enrollment_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">
                              {enrollment.course_offering?.course?.title || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {enrollment.course_offering?.course?.code || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {enrollment.course_offering?.acad_session || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {enrollment.enrol_type || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                enrollment.enrol_status === "enrolled"
                                  ? "bg-green-100 text-green-800"
                                  : enrollment.enrol_status === "pending advisor approval"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {enrollment.enrol_status || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 font-semibold">
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
        )}
      </div>
    </div>
  );
}
