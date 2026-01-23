import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { BookOpen, User } from "lucide-react";

function StudentRecordPage() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [studentCredits, setStudentCredits] = useState([]);
  const [cgpaData, setCGPAData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NEW: session filter state
  const [selectedSession, setSelectedSession] = useState("ALL");

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

      // ✅ Fetch student credit details from student_credit table
      const creditsRes = await axiosClient.get("/student/credits");

      if (creditsRes.data?.success) {
        setStudentCredits(creditsRes.data.data || []);
      } else {
        setStudentCredits([]);
      }

      // ✅ Fetch CGPA/SGPA from cgpa_table
      const cgpaRes = await axiosClient.get("/student/cgpa");

      if (cgpaRes.data?.success) {
        setCGPAData(cgpaRes.data.data || []);
      } else {
        setCGPAData([]);
      }
    } catch (err) {
      console.error("Error fetching student record:", err);

      if (!err.response) {
        setError("Backend not reachable. Please try again later.");
      } else if (err.response.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError("Failed to load student record");
      }

      setStudentInfo(null);
      setEnrolledCourses([]);
      setStudentCredits([]);
      setCGPAData([]);
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

  // ✅ Group courses by session + attach sgpa/credits from student_credit table
  const groupCoursesBySession = useMemo(() => {
    const sessionGroups = {};

    // Create a map of enrollments by ID for quick lookup
    const enrollmentMap = {};
    enrolledCourses.forEach((enrollment) => {
      enrollmentMap[enrollment.enrollment_id] = enrollment;
    });

    // Create a map of SGPA by session from cgpaData
    const sgpaMap = {};
    cgpaData.forEach((row) => {
      sgpaMap[row.session] = {
        sg: row.sg,
        cg: row.cg,
        semester: row.semester,
      };
    });

    // Group student_credit records by session
    studentCredits.forEach((credit) => {
      const session = credit.acad_session || "Unknown";
      if (!sessionGroups[session]) {
        sessionGroups[session] = [];
      }

      // Enrich credit data with course enrollment information
      const enrichedCredit = {
        ...credit,
        enrollment: enrollmentMap[credit.enrol_id],
      };
      sessionGroups[session].push(enrichedCredit);
    });

    return Object.entries(sessionGroups)
      .map(([session, credits]) => {
        // Sum credits for the session
        const totalRegisteredCredits = credits.reduce(
          (sum, c) => sum + (parseFloat(c.cred_registered) || 0),
          0
        );
        const totalEarnedCredits = credits.reduce(
          (sum, c) => sum + (parseFloat(c.cred_earned) || 0),
          0
        );

        // Get SGPA from cgpaData
        const sgpa = sgpaMap[session]?.sg || 0;

        // Get courses for this session
        const courses = credits.map((c) => c.enrollment).filter(Boolean);

        return {
          session,
          credits,
          courses,
          sgpa,
          totalRegisteredCredits,
          totalEarnedCredits,
        };
      })
      .sort((a, b) => a.session.localeCompare(b.session));
  }, [studentCredits, enrolledCourses, cgpaData]);

  // ✅ NEW: list of all sessions for dropdown
  const availableSessions = useMemo(() => {
    return groupCoursesBySession.map((g) => g.session);
  }, [groupCoursesBySession]);

  // ✅ NEW: filtered sessions based on dropdown selection
  const filteredSessionGroups = useMemo(() => {
    if (selectedSession === "ALL") return groupCoursesBySession;
    return groupCoursesBySession.filter((g) => g.session === selectedSession);
  }, [groupCoursesBySession, selectedSession]);

  // ✅ Total earned credits across sessions
  const totalEarnedCredits = useMemo(() => {
    return groupCoursesBySession.reduce((total, sessionGroup) => {
      return total + sessionGroup.totalEarnedCredits;
    }, 0);
  }, [groupCoursesBySession]);

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

  const cgpaValue = Number(studentInfo?.cgpa);
  const cgpaDisplay = Number.isFinite(cgpaValue) ? cgpaValue.toFixed(2) : "N/A";

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

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    First Name
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.first_name || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Last Name
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.last_name || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Roll No.
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.email
                      ? studentInfo.users.email.split("@")[0]
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Degree
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.degree || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.email || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Department / Branch
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.branch || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Year of Entry
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.email
                      ? studentInfo.users.email.substring(0, 4)
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Gender
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentInfo.users?.gender || "N/A"}
                  </p>
                </div>
              </div>

              {/* ✅ Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* CGPA */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide">
                    CGPA
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {cgpaDisplay}
                  </p>
                </div>

                {/* Total Earned Credits */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide">
                    TOTAL EARNED CREDITS
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {totalEarnedCredits.toFixed(2)}
                  </p>
                </div>

                {/* Total Courses */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide">
                    TOTAL COURSES
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {enrolledCourses.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Course Records Grouped by Session */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b-2 border-blue-200">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Course Records by Session
                </h2>
              </div>

              {/* ✅ NEW: Session Filter Dropdown */}
              <select
                className="select select-bordered w-full sm:w-64"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="ALL">All Sessions</option>
                {availableSessions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            {studentCredits.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No course records found</p>
              </div>
            ) : (
              <div className="space-y-8">
                {[...filteredSessionGroups].reverse().map((sessionGroup) => (
                  <div
                    key={sessionGroup.session}
                    className="border-b-2 border-gray-200 pb-8 last:border-b-0"
                  >
                    {/* Session Header */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Session
                        </span>
                        {sessionGroup.session}
                      </h3>

                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            SGPA
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {Number(sessionGroup.sgpa).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            REG. CRED
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {sessionGroup.totalRegisteredCredits.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                          <p className="text-xs font-semibold text-gray-500">
                            EARN. CRED
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {sessionGroup.totalEarnedCredits.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Courses Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-300 bg-gray-50">
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
                              Credits
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
                          {sessionGroup.credits.map((credit, idx) => (
                            <tr
                              key={credit.credit_id || idx}
                              className="border-b border-gray-200 hover:bg-blue-50"
                            >
                              <td className="px-4 py-3 text-sm">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold text-black-600">
                                {credit.enrollment?.course_offering?.course
                                  ?.code || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {credit.enrollment?.course_offering?.course
                                  ?.title || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {credit.cred_registered || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusColor(
                                    credit.enrollment?.enrol_status
                                  )}`}
                                >
                                  {credit.enrollment?.enrol_status || "Unknown"}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold ${getGradeColor(
                                  credit.grade
                                )}`}
                              >
                                {credit.grade || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentRecordPage;
