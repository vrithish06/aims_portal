import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import {
  BookOpen,
  Search,
  X,
  User,
  Calendar,
  Clock,
  GraduationCap,
  Award,
  ChevronDown,
  Check
} from "lucide-react";

/* ================= FILTER DROPDOWN ================= */
function FilterDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (opt) => {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    setSelected(newSet);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-colors"
      >
        {label}
        {selected.size > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-blue-600 rounded-full border border-white shadow-sm">
            {selected.size}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 text-left transition-colors"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.has(opt)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-300"
                  }`}
              >
                {selected.has(opt) && <Check className="w-3 h-3" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EnrolledCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [dropping, setDropping] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Filter States (Set based)
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [sessionFilter, setSessionFilter] = useState(new Set());

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.user_id) {
      toast.error("Please login first");
      return;
    }
    fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/student/enrolled-courses");
      if (response.data?.success) {
        setCourses(response.data.data || []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      toast.error("Failed to load enrolled courses");
      console.error("Fetch error:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCredits = () => {
    if (courses.length === 0) return { total: 0, active: 0 };

    const getCourseCredits = (c) => {
      const ltp = c.course_offering?.course?.ltp;
      if (!ltp) return 0;
      const first = ltp.split("-")[0];
      const val = parseInt(first, 10);
      return Number.isFinite(val) ? val : 0;
    };

    const activeCredits = courses
      .filter((c) => c.enrol_status === "enrolled")
      .reduce((sum, c) => sum + getCourseCredits(c), 0);

    const totalCredits = courses.reduce((sum, c) => sum + getCourseCredits(c), 0);

    return { total: totalCredits, active: activeCredits };
  };

  const handleEnrollmentClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
  };

  const handleWithdraw = async (enrollmentId) => {
    // If modal is open, use that enrollment, otherwise find it
    const enrollment = selectedEnrollment || courses.find(c => c.id === enrollmentId);
    if (!enrollment) return;

    if (!window.confirm("Are you sure you want to withdraw from this course?")) return;

    try {
      setWithdrawing(enrollmentId);
      const offeringId = enrollment.course_offering?.offering_id;
      const response = await axiosClient.post(`/offering/${offeringId}/withdraw`);

      if (response.data?.success) {
        toast.success("Course withdrawal successful");
        await fetchEnrolledCourses();
        setSelectedEnrollment(null); // Close modal if open
      } else {
        toast.error("Withdraw failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to withdraw from course");
      console.error("Withdraw error:", error);
    } finally {
      setWithdrawing(null);
    }
  };

  const handleDrop = async (enrollmentId) => {
    const enrollment = selectedEnrollment || courses.find(c => c.id === enrollmentId);
    if (!enrollment) return;

    if (!window.confirm("Are you sure you want to drop this course?")) return;

    try {
      setDropping(enrollmentId);
      const offeringId = enrollment.course_offering?.offering_id;
      const response = await axiosClient.post(`/offering/${offeringId}/drop`);

      if (response.data?.success) {
        toast.success("Course dropped successfully");
        await fetchEnrolledCourses();
        setSelectedEnrollment(null); // Close modal if open
      } else {
        toast.error("Drop failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to drop course");
      console.error("Drop error:", error);
    } finally {
      setDropping(null);
    }
  };

  // Unique filter values
  const getUniqueValues = (key) => {
    const vals = courses
      .map((c) => (key === "status" ? c.enrol_status : c.course_offering?.acad_session))
      .filter(Boolean);

    return [...new Set(vals)].sort();
  };

  // Filtered courses
  const filteredCourses = courses.filter((course) => {
    const courseCode = course.course_offering?.course?.code?.toLowerCase() || "";
    const courseTitle = course.course_offering?.course?.title?.toLowerCase() || "";

    const matchesSearch =
      !searchQuery ||
      courseCode.includes(searchQuery.toLowerCase()) ||
      courseTitle.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter.size === 0 || statusFilter.has(course.enrol_status);
    const matchesSession = sessionFilter.size === 0 || sessionFilter.has(course.course_offering?.acad_session);

    return matchesSearch && matchesStatus && matchesSession;
  });

  const clearAllFilters = () => {
    setStatusFilter(new Set());
    setSessionFilter(new Set());
    setSearchQuery("");
  };

  const hasActiveFilters = () => {
    return statusFilter.size > 0 || sessionFilter.size > 0 || !!searchQuery;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching your courses...</p>
      </div>
    );
  }

  const credits = calculateCredits();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <BookOpen className="w-8 h-8 text-blue-600" />
          My Enrolled Courses
        </h1>
        <p className="text-lg text-gray-600">
          Total enrolled: {courses.length} course{courses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>

          <FilterDropdown
            label="Status"
            options={getUniqueValues("status")}
            selected={statusFilter}
            setSelected={setStatusFilter}
          />
          <FilterDropdown
            label="Session"
            options={getUniqueValues("session")}
            selected={sessionFilter}
            setSelected={setSessionFilter}
          />

          <div className="w-14 ml-2 flex justify-center">
            <button
              onClick={clearAllFilters}
              className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${statusFilter.size > 0 || sessionFilter.size > 0 || searchQuery
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
      <div className="py-8 px-4 w-full">
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl">
            <span className="text-blue-800 font-medium text-sm">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
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

        {filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 px-6 py-12 rounded-xl text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <span className="text-lg font-medium block">You haven't enrolled in any courses yet.</span>
            <span className="text-sm text-slate-400">Visit the Browse Courses page to enroll.</span>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((enrollment) => {
              const course = enrollment.course_offering?.course;
              const offering = enrollment.course_offering;
              const instructor = offering?.instructor?.users;

              // Status Badge Helper
              const getStatusStyle = (status) => {
                switch (status?.toLowerCase()) {
                  case 'enrolled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
                  case 'withdrawn': return 'bg-orange-50 text-orange-700 border-orange-200';
                  case 'dropped': return 'bg-red-50 text-red-700 border-red-200';
                  default: return 'bg-slate-50 text-slate-700 border-slate-200';
                }
              };

              return (
                <div
                  key={enrollment.id}
                  onClick={() => handleEnrollmentClick(enrollment)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden"
                >
                  {/* CARD HEADER */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mb-2">
                          {course?.code || 'N/A'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {course?.title || 'Untitled Course'}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex-shrink-0 ${getStatusStyle(enrollment.enrol_status)}`}>
                        {enrollment.enrol_status || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-6 flex-1 space-y-5">
                    {/* Instructor & Dept */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[120px]" title={instructor ? `${instructor.first_name} ${instructor.last_name}` : 'TBA'}>
                          {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'TBA'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[80px]" title={offering?.dept_name || 'N/A'}>{offering?.dept_name || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-2.5 border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">Slot</span>
                          <span className="text-xs font-bold text-slate-700 leading-none">{offering?.slot || '-'}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-2.5 border border-slate-100">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">Credits</span>
                          <span className="text-xs font-bold text-slate-700 leading-none">{course?.ltp || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between pt-3 text-[11px] font-medium text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        <span>{offering?.acad_session}</span>
                      </div>
                      <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                        {enrollment.enrol_type}
                      </div>
                    </div>
                  </div>

                  {/* CARD FOOTER - Actions */}
                  <div className="p-4 pt-0 mt-auto space-y-3" onClick={(e) => e.stopPropagation()}>
                    {enrollment.enrol_status === 'enrolled' ? (
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-white border border-orange-200 text-orange-600 py-2 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors shadow-sm flex items-center justify-center gap-2 shadow-orange-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(enrollment.id);
                          }}
                          disabled={withdrawing === enrollment.id}
                        >
                          {withdrawing === enrollment.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : "Withdraw"}
                        </button>
                        <button
                          className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2 shadow-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrop(enrollment.id);
                          }}
                          disabled={dropping === enrollment.id}
                        >
                          {dropping === enrollment.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : "Drop"}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-slate-50 text-slate-400 text-center text-xs font-bold rounded-lg border border-slate-200 uppercase tracking-wide">
                        Action Unavailable
                      </div>
                    )}

                    <button
                      className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-xs shadow-md shadow-blue-200 uppercase tracking-wide"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnrollmentClick(enrollment);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - Kept same logic but cleaned up styling slightly if needed */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <span className="inline-block text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2">
                  {selectedEnrollment.course_offering?.course?.code}
                </span>
                <h3 className="font-bold text-2xl text-gray-900">
                  {selectedEnrollment.course_offering?.course?.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Modal Content Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Course Title</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEnrollment.course_offering?.course?.title}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                  <span className={`font-bold px-3 py-1 rounded ${selectedEnrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' :
                    selectedEnrollment.enrol_status === 'completed' ? 'text-blue-600 bg-blue-100' :
                      selectedEnrollment.enrol_status === 'student withdrawn' ? 'text-red-600 bg-red-100' :
                        selectedEnrollment.enrol_status === 'student dropped' ? 'text-red-600 bg-red-100' :
                          'text-yellow-600 bg-yellow-100'
                    }`}>
                    {selectedEnrollment.enrol_status ? selectedEnrollment.enrol_status.charAt(0).toUpperCase() + selectedEnrollment.enrol_status.slice(1) : 'Pending'}
                  </span>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-1">Credits</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedEnrollment.course_offering?.course?.ltp}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Grade</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedEnrollment.grade || "Not Graded"}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 uppercase mb-1">Slot</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedEnrollment.course_offering?.slot}
                  </p>
                </div>
              </div>

              {/* Instructor Section */}
              {(() => {
                const instructors = selectedEnrollment.course_offering?.course_offering_instructor || [];
                const coordinator = instructors.find(i => i.is_coordinator);
                if (coordinator?.instructor?.users) {
                  return (
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {coordinator.instructor.users.first_name}{" "}
                          {coordinator.instructor.users.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {coordinator.instructor.users.email}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Detailed List */}
              <div className="pt-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Additional Details</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.course_offering?.dept_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Session</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.course_offering?.acad_session}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Section</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.course_offering?.section}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Enrollment Type</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.enrol_type}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(selectedEnrollment.enrol_status === 'enrolled' ||
                selectedEnrollment.enrol_status === 'pending advisor approval' ||
                selectedEnrollment.enrol_status === 'pending instructor approval') && (
                  <div className="border-t-2 border-orange-200 pt-6">
                    <p className="text-lg font-bold text-gray-900 mb-4">Course Actions</p>
                    <div className="flex gap-3">
                      {selectedEnrollment.enrol_status === 'enrolled' && (
                        <button
                          className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          onClick={() => {
                            handleWithdraw(selectedEnrollment.id);
                          }}
                          disabled={withdrawing === selectedEnrollment.id}
                        >
                          {withdrawing === selectedEnrollment.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                      <button
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${selectedEnrollment.enrol_status === 'enrolled'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                          }`}
                        onClick={() => {
                          handleDrop(selectedEnrollment.id);
                        }}
                        disabled={dropping === selectedEnrollment.id}
                        title={selectedEnrollment.enrol_status !== 'enrolled' ? 'Can drop pending requests' : ''}
                      >
                        {dropping === selectedEnrollment.id ? 'Dropping...' : 'Drop'}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrolledCoursesPage;