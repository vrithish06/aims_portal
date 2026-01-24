import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Search, 
  X, 
  ListFilter, 
  User, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Award 
} from "lucide-react";

function EnrolledCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [dropping, setDropping] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [tempFilters, setTempFilters] = useState({
    status: [],
    session: [],
  });

  const [filters, setFilters] = useState({
    status: [],
    session: [],
  });

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

  const handleDrop = async () => {
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

    const matchesFilters =
      (filters.status.length === 0 || filters.status.includes(course.enrol_status)) &&
      (filters.session.length === 0 ||
        filters.session.includes(course.course_offering?.acad_session));

    return matchesSearch && matchesFilters;
  });

  const toggleTempFilter = (category, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const toggleFilters = () => {
    if (showFilters) {
      setShowFilters(false);
    } else {
      setTempFilters(filters);
      setShowFilters(true);
    }
  };

  const clearAllFilters = () => {
    const emptyFilters = { status: [], session: [] };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setSearchQuery("");
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some((f) => f.length > 0) || !!searchQuery;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
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

      {/* Search Bar with Filter Button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          <button
            onClick={toggleFilters}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors flex-shrink-0 ${
              showFilters
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {showFilters ? (
              <>
                <X className="w-5 h-5" />
                <span className="font-medium">Close</span>
              </>
            ) : (
              <>
                <ListFilter className="w-5 h-5" />
                <span className="font-medium">Filters</span>
                {hasActiveFilters() && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Object.values(filters).reduce((acc, curr) => acc + curr.length, 0)}
                  </span>
                )}
              </>
            )}
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex gap-4">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0" onKeyPress={(e) => e.key === 'Enter' && applyFilters()}>
            <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {Object.values(tempFilters).some((f) => f.length > 0) && (
                  <button
                    onClick={() => setTempFilters({ status: [], session: [] })}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  {getUniqueValues("status").map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.status.includes(status)}
                        onChange={() => toggleTempFilter("status", status)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Session Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Session</h4>
                <div className="space-y-2">
                  {getUniqueValues("session").map((session) => (
                    <label key={session} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.session.includes(session)}
                        onChange={() => toggleTempFilter("session", session)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{session}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        <div className="flex-1">
          {hasActiveFilters() && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
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
            </div>
          )}

          {courses.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
              <span>You haven't enrolled in any courses yet. Visit the <strong>Browse Courses</strong> page to enroll.</span>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {filteredCourses.map((enrollment) => {
                const course = enrollment.course_offering?.course;
                const offering = enrollment.course_offering;
                const instructor = offering?.instructor?.users;

                // Status Badge Helper
                const getStatusStyle = (status) => {
                  switch (status?.toLowerCase()) {
                    case 'enrolled': return 'bg-green-100 text-green-700 border-green-200';
                    case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
                    case 'withdrawn': return 'bg-orange-100 text-orange-700 border-orange-200';
                    case 'dropped': return 'bg-red-100 text-red-700 border-red-200';
                    default: return 'bg-gray-100 text-gray-700 border-gray-200';
                  }
                };

                return (
                  <div
                    key={enrollment.id}
                    onClick={() => handleEnrollmentClick(enrollment)}
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
                  >
                    {/* CARD HEADER */}
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2">
                            {course?.code || 'N/A'}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {course?.title || 'Untitled Course'}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap ${getStatusStyle(enrollment.enrol_status)}`}>
                          {enrollment.enrol_status || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 flex-1 space-y-4">
                      
                      {/* Row 1: Instructor & Dept */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[120px]" title={instructor ? `${instructor.first_name} ${instructor.last_name}` : 'TBA'}>
                            {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'TBA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{offering?.dept_name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Row 2: Metrics Grid (Slot, Credits, Grade) */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Slot */}
                        <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Slot</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{offering?.slot || '-'}</span>
                        </div>

                        {/* Credits */}
                        <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Credits</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{course?.ltp || '-'}</span>
                        </div>

                        {/* Grade */}
                        <div className={`rounded-lg p-2 flex flex-col items-center justify-center text-center ${enrollment.grade ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Award className={`w-3 h-3 ${enrollment.grade ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-[10px] font-bold uppercase ${enrollment.grade ? 'text-green-600' : 'text-gray-400'}`}>Grade</span>
                          </div>
                          <span className={`text-sm font-bold ${enrollment.grade ? 'text-green-700' : 'text-gray-400'}`}>
                            {enrollment.grade || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Session & Type */}
                      <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{offering?.acad_session}</span>
                        </div>
                        <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold uppercase tracking-wide">
                          {enrollment.enrol_type}
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER - Actions */}
                    <div className="p-4 pt-0 mt-auto space-y-3" onClick={(e) => e.stopPropagation()}>
                      {enrollment.enrol_status === 'enrolled' ? (
                        <div className="flex gap-2">
                          <button
                            className="flex-1 bg-white border border-orange-200 text-orange-600 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
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
                            className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
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
                        <div className="w-full py-2 bg-gray-50 text-gray-500 text-center text-sm font-medium rounded-lg border border-gray-200">
                          Action Unavailable
                        </div>
                      )}
                      
                      <button
                        className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnrollmentClick(enrollment);
                        }}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
                  <span className={`font-bold px-3 py-1 rounded ${
                    selectedEnrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' : 
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
              {selectedEnrollment.course_offering?.instructor?.users && (
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedEnrollment.course_offering.instructor.users.first_name}{" "}
                      {selectedEnrollment.course_offering.instructor.users.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedEnrollment.course_offering.instructor.users.email}
                    </p>
                  </div>
                </div>
              )}

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
                          handleWithdraw(selectedEnrollment);
                        }}
                        disabled={withdrawing === selectedEnrollment.enrollment_id}
                      >
                        {withdrawing === selectedEnrollment.enrollment_id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                    <button 
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        selectedEnrollment.enrol_status === 'enrolled' 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        handleDrop(selectedEnrollment);
                      }}
                      disabled={dropping === selectedEnrollment.enrollment_id}
                      title={selectedEnrollment.enrol_status !== 'enrolled' ? 'Can drop pending requests' : ''}
                    >
                      {dropping === selectedEnrollment.enrollment_id ? 'Dropping...' : 'Drop'}
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