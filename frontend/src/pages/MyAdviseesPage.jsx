import { useEffect, useState, useRef } from "react";
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

  // If specific student selected, show details view
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedStudent(null);
              setEnrollments([]);
            }}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            Back to Advisees
          </button>

          {/* Student Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {selectedStudent.users?.first_name} {selectedStudent.users?.last_name}
                </h2>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {selectedStudent.email}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-200">
                {selectedStudent.users?.first_name?.charAt(0)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Degree</p>
                <p className="font-bold text-slate-800">{selectedStudent.degree}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Branch</p>
                <p className="font-bold text-slate-800">{selectedStudent.branch}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Batch</p>
                <p className="font-bold text-slate-800">{selectedStudent.batch}</p>
              </div>
            </div>
          </div>

          {/* Enrollments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Enrollments
              </h3>
            </div>

            {enrollmentsLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-md text-blue-600"></span>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p>No enrollments found for this student.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 font-bold">Course</th>
                      <th className="px-6 py-3 font-bold">Code</th>
                      <th className="px-6 py-3 font-bold text-center">Session</th>
                      <th className="px-6 py-3 font-bold text-center">Type</th>
                      <th className="px-6 py-3 font-bold text-center">Status</th>
                      <th className="px-6 py-3 font-bold text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.enrollment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {enrollment.course_offering?.course?.title || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {enrollment.course_offering?.course?.code || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {enrollment.course_offering?.acad_session || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {enrollment.enrol_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${enrollment.enrol_status === "enrolled"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : enrollment.enrol_status?.includes("pending")
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}
                          >
                            {enrollment.enrol_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {enrollment.grade || "—"}
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
            <Users className="w-8 h-8 text-blue-600" />
            My Advisees
          </h1>
          <p className="text-lg text-gray-600">
            Total Advisees: {advisees.length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>

          <FilterDropdown
            label="Degree"
            options={getUniqueValues('degree')}
            selected={degreeFilter}
            setSelected={setDegreeFilter}
          />
          <FilterDropdown
            label="Batch"
            options={getUniqueValues('batch').map(String)}
            selected={batchFilter}
            setSelected={setBatchFilter}
          />
          <FilterDropdown
            label="Branch"
            options={getUniqueValues('branch')}
            selected={branchFilter}
            setSelected={setBranchFilter}
          />

          <div className="w-14 ml-2 flex justify-center">
            <button
              onClick={clearAllFilters}
              className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${hasActiveFilters()
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
                }`}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-[1600px] mx-auto">
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl">
            <span className="text-blue-800 font-medium text-sm">
              {filteredAdvisees.length} student{filteredAdvisees.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
          </div>
        )}

        {/* No Advisees */}
        {!loading && filteredAdvisees.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No advisees found</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {hasActiveFilters() ? "Try adjusting your filters or search." : "You have no assigned advisees."}
            </p>
          </div>
        )}

        {/* Advisees Grid */}
        {!loading && filteredAdvisees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAdvisees.map((student) => (
              <div
                key={student.student_id}
                onClick={() => viewStudentEnrollments(student)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {student.users?.first_name} {student.users?.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm flex-shrink-0">
                    {student.users?.first_name?.charAt(0)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Degree</p>
                      <p className="text-xs font-bold text-slate-700">{student.degree}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Batch</p>
                      <p className="text-xs font-bold text-slate-700">{student.batch}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Branch</p>
                      <p className="text-xs font-bold text-blue-700">{student.branch}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 pt-0 mt-auto">
                  <button className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wide shadow-md shadow-blue-200 hover:bg-blue-700 transition">
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

