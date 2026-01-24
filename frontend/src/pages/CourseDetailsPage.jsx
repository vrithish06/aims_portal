import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { Users, ArrowLeft, BookOpen, ChevronDown, Check } from "lucide-react";

function CourseDetailsPage() {
  const { offeringId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [offering, setOffering] = useState(location.state?.offering || null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(!offering);

  // ✅ Multi-select Filters (Set)
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [actionFilter, setActionFilter] = useState(new Set());

  // ✅ Search
  const [searchQuery, setSearchQuery] = useState("");

  const [approving, setApproving] = useState(null);
  const [approveAll, setApproveAll] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState(new Set());
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isTeacherOrAdmin = user?.role === "instructor" || user?.role === "admin";
  const isOfferingInstructor = 
    user?.role === "admin" || 
    (user?.user_id && offering?.instructor && (
      String(user.user_id) === String(offering.instructor.user_id) || 
      String(user.user_id) === String(offering.instructor.users?.user_id)
    ));
  // ✅ Dropdown open/close (hover UI)
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);

  const typeRef = useRef(null);
  const statusRef = useRef(null);
  const actionRef = useRef(null);
  const offeringStatusRef = useRef(null);

  // debugging 
  useEffect(() => {
    if (offering && user) {
      console.log("--- DEBUG PERMISSIONS ---");
      console.log("My User ID:", user.user_id, typeof user.user_id);
      console.log("Instructor Table User ID:", offering.instructor?.user_id, typeof offering.instructor?.user_id);
      console.log("Instructor Relation User ID:", offering.instructor?.users?.user_id, typeof offering.instructor?.users?.user_id);
      console.log("Role:", user.role);
    }
  }, [offering, user]);

  useEffect(() => {
    if (!offering) {
      fetchOfferingDetails();
    } else {
      fetchEnrolledStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offeringId]);

  // ✅ close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
      if (actionRef.current && !actionRef.current.contains(e.target)) setActionOpen(false);
      if (offeringStatusRef.current && !offeringStatusRef.current.contains(e.target)) setStatusDropdownOpen(false);
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const fetchOfferingDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/offering/${offeringId}`);
      if (response.data.success) {
        console.log("User ID:", user?.user_id);
        console.log("Instructor ID:", response.data.data?.instructor_id);
        setOffering(response.data.data);
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error("Failed to load course details");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await axiosClient.get(`/offering/${offeringId}/enrollments`);
      if (response.data.success) {
        setEnrolledStudents(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch enrolled students:", error);
      setEnrolledStudents([]);
    }
  };

  const toggleSetItem = (setState, value) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearSet = (setState) => setState(new Set());

  const clearAllFilters = () => {
    clearSet(setEnrollmentTypeFilter);
    clearSet(setStatusFilter);
    clearSet(setActionFilter);
    setSearchQuery("");
  };

  const handleApproveStudent = async (enrollment) => {
    try {
      setApproving(enrollment.enrollment_id);

      const response = await axiosClient.put(
        `/offering/${offeringId}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: "pending advisor approval" }
      );

      if (response.data.success) {
        toast.success("Student approved by instructor. Pending advisor approval.");
        fetchEnrolledStudents();
        setSelectedForApproval((prev) => {
          const newSet = new Set(prev);
          newSet.delete(enrollment.enrollment_id);
          return newSet;
        });
      }
    } catch (error) {
      toast.error("Failed to approve student");
      console.error("Approval error:", error);
    } finally {
      setApproving(null);
    }
  };

  const handleRejectStudent = async (enrollment) => {
    try {
      setApproving(enrollment.enrollment_id);

      const response = await axiosClient.put(
        `/offering/${offeringId}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: "instructor rejected" }
      );

      if (response.data.success) {
        toast.success("Student enrollment rejected.");
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error("Failed to reject student");
      console.error("Rejection error:", error);
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    const pendingStudents = filteredStudents.filter(
      (s) => s.enrol_status === "pending instructor approval"
    );

    if (pendingStudents.length === 0) {
      toast.error("No pending students to approve");
      return;
    }

    try {
      setApproveAll(true);

      const approvalPromises = pendingStudents.map((student) =>
        axiosClient.put(
          `/offering/${offeringId}/enrollments/${student.enrollment_id}`,
          { enrol_status: "pending advisor approval" }
        )
      );

      const results = await Promise.all(approvalPromises);
      const allSuccessful = results.every((r) => r.data.success);

      if (allSuccessful) {
        toast.success(
          `${pendingStudents.length} students approved successfully. Pending advisor approval.`
        );
        fetchEnrolledStudents();
        setSelectedForApproval(new Set());
      } else {
        toast.error("Some students could not be approved");
      }
    } catch (error) {
      toast.error("Failed to approve students");
      console.error("Bulk approval error:", error);
    } finally {
      setApproveAll(false);
    }
  };

  const handleUpdateOfferingStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      setStatusDropdownOpen(false);
      
      const response = await axiosClient.put(`/offering/${offeringId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`Course offering status changed to ${newStatus}`);
        setOffering((prev) => ({
          ...prev,
          status: newStatus
        }));
      } else {
        toast.error(response.data.message || "Failed to update offering status");
      }
    } catch (error) {
      console.error("Error updating offering status:", error);
      toast.error(error.response?.data?.message || "Failed to update offering status");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <span>Course not found</span>
          </div>
        </div>
      </div>
    );
  }

  const course = offering.course;
  const instructor = offering.instructor?.users;

  const uniqueEnrollmentTypes = useMemo(() => {
    return [...new Set(enrolledStudents.map((s) => s.enrol_type).filter(Boolean))].sort();
  }, [enrolledStudents]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(enrolledStudents.map((s) => s.enrol_status).filter(Boolean))].sort();
  }, [enrolledStudents]);

  const actionOptions = [
    { label: "Pending Instructor Approval", value: "pending instructor approval" },
    { label: "Pending Advisor Approval", value: "pending advisor approval" },
    { label: "Enrolled", value: "enrolled" },
    { label: "Completed", value: "completed" },
    { label: "Rejected", value: "instructor rejected" },
    { label: "Other", value: "__other__" },
  ];

  const normalizeStr = (val) => (val ?? "").toString().toLowerCase().trim();

  const filteredStudents = useMemo(() => {
    const query = normalizeStr(searchQuery);

    return enrolledStudents.filter((student) => {
      const typeMatch =
        enrollmentTypeFilter.size === 0 || enrollmentTypeFilter.has(student.enrol_type);

      const statusMatch = statusFilter.size === 0 || statusFilter.has(student.enrol_status);

      let actionMatch = true;
      if (isTeacherOrAdmin && actionFilter.size > 0) {
        const status = student.enrol_status;

        const isOther =
          status &&
          ![
            "pending instructor approval",
            "pending advisor approval",
            "enrolled",
            "completed",
            "instructor rejected",
          ].includes(status);

        const matchesOther = actionFilter.has("__other__") && isOther;
        const matchesExact = actionFilter.has(status);

        actionMatch = matchesOther || matchesExact;
      }

      const searchMatch =
        query.length === 0 ||
        [
          student.student_name,
          student.student_email,
          student.enrol_type,
          student.enrol_status,
        ]
          .map(normalizeStr)
          .some((field) => field.includes(query));

      return typeMatch && statusMatch && actionMatch && searchMatch;
    });
  }, [
    enrolledStudents,
    enrollmentTypeFilter,
    statusFilter,
    actionFilter,
    searchQuery,
    isTeacherOrAdmin,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course Offerings
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">{course?.code}</h1>
                  </div>
                </div>
                {isOfferingInstructor ? (
                  <div className="relative" ref={offeringStatusRef}>
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      disabled={statusUpdating}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                        offering.status === "Enrolling"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : offering.status === "Canceled"
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : offering.status === "Running"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : offering.status === "Completed"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      } transition disabled:opacity-50`}
                    >
                      {offering.status}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          {["Enrolling", "Running", "Completed", "Canceled"].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateOfferingStatus(status)}
                              disabled={statusUpdating || offering.status === status}
                              className={`w-full text-left px-4 py-2 text-sm rounded-md transition ${
                                offering.status === status
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : "hover:bg-blue-50 text-gray-700"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      offering.status === "Enrolling"
                        ? "bg-green-100 text-green-800"
                        : offering.status === "Canceled"
                        ? "bg-red-100 text-red-800"
                        : offering.status === "Running"
                        ? "bg-yellow-100 text-yellow-800"
                        : offering.status === "Completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {offering.status}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-gray-700 mb-6">{course?.title}</h2>

              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Credits (L-T-P)</p>
                  <p className="text-sm font-semibold text-gray-900">{course?.ltp || "N/A"}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Academic Session</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.acad_session}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Department</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.dept_name}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Degree</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.degree || "N/A"}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Section</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.section || "N/A"}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Slot</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.slot || "N/A"}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Instructor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {instructor ? `${instructor.first_name} ${instructor.last_name}` : "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 font-semibold">Instructor Email</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {instructor?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Enrolled Students */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* ✅ Heading row + Search */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Enrolled Students</h3>

                <span className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                  {filteredStudents.length}
                </span>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name / email / status / type..."
                  className="input input-bordered w-full sm:w-72 md:w-80 mt-3 sm:mt-0"
                />
              </div>

              {/* ✅ Clear All filters */}
              {(enrollmentTypeFilter.size > 0 ||
                statusFilter.size > 0 ||
                (isTeacherOrAdmin && actionFilter.size > 0) ||
                searchQuery.trim().length > 0) && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {offering?.status?.toLowerCase() === "canceled" ? (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-100 px-5 py-3 text-gray-700">
                  <p className="font-semibold text-sm">⚠ Course Cancelled</p>
                  <p className="text-xs mt-1 text-gray-600">
                    This course offering has been cancelled. Please contact the instructor for further inquiries.
                  </p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
                  <span>No students enrolled in this course yet.</span>
                </div>
              ) : (
                <>
                  {/* Approve All Button */}
                  {isTeacherOrAdmin &&
                    statusFilter.has("pending instructor approval") &&
                    filteredStudents.some((s) => s.enrol_status === "pending instructor approval") && (
                      <div className="mb-4">
                        <button
                          onClick={handleApproveAll}
                          disabled={approveAll}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {approveAll ? "Approving All..." : "Accept All"}
                        </button>
                      </div>
                    )}

                  {filteredStudents.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
                      <span>No students match your filters/search.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200">
                            {isTeacherOrAdmin && (
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-10"></th>
                            )}

                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                              Student Name
                            </th>

                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                              Email
                            </th>

                            {/* ✅ Enrollment Type filter (hover dropdown) */}
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                              <div
                                className="relative inline-flex items-center gap-2 group"
                                ref={typeRef}
                              >
                                <span>Enrollment Type</span>
                                <button
                                  type="button"
                                  onClick={() => setTypeOpen((p) => !p)}
                                  className="text-gray-500 hover:text-gray-800"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                {/* dropdown */}
                                <div
                                  className={`absolute left-0 top-8 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 transition-all duration-150 ${
                                    typeOpen
                                      ? "opacity-100 visible"
                                      : "opacity-0 invisible"
                                  }`}
                                >
                                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">Filter</p>
                                    <button
                                      onClick={() => clearSet(setEnrollmentTypeFilter)}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Clear
                                    </button>
                                  </div>

                                  <div className="p-3 space-y-2 max-h-60 overflow-auto">
                                    {uniqueEnrollmentTypes.length === 0 ? (
                                      <p className="text-sm text-gray-500">No types found</p>
                                    ) : (
                                      uniqueEnrollmentTypes.map((type) => (
                                        <label
                                          key={type}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={enrollmentTypeFilter.has(type)}
                                            onChange={() => toggleSetItem(setEnrollmentTypeFilter, type)}
                                            className="w-4 h-4 rounded border-gray-300"
                                          />
                                          <span className="text-sm text-gray-700">{type}</span>
                                        </label>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </th>

                            {/* ✅ Status filter (hover dropdown) */}
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                              <div
                                className="relative inline-flex items-center gap-2 group"
                                ref={statusRef}
                              >
                                <span>Status</span>
                                <button
                                  type="button"
                                  onClick={() => setStatusOpen((p) => !p)}
                                  className="text-gray-500 hover:text-gray-800"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                <div
                                  className={`absolute left-0 top-8 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 transition-all duration-150 ${
                                    statusOpen
                                      ? "opacity-100 visible"
                                      : "opacity-0 invisible"
                                  }`}
                                >
                                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">Filter</p>
                                    <button
                                      onClick={() => clearSet(setStatusFilter)}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Clear
                                    </button>
                                  </div>

                                  <div className="p-3 space-y-2 max-h-60 overflow-auto">
                                    {uniqueStatuses.length === 0 ? (
                                      <p className="text-sm text-gray-500">No statuses found</p>
                                    ) : (
                                      uniqueStatuses.map((status) => (
                                        <label
                                          key={status}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={statusFilter.has(status)}
                                            onChange={() => toggleSetItem(setStatusFilter, status)}
                                            className="w-4 h-4 rounded border-gray-300"
                                          />
                                          <span className="text-sm text-gray-700 capitalize">
                                            {status.replaceAll("_", " ")}
                                          </span>
                                        </label>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </th>

                            {/* ✅ Action filter ONLY for instructor/admin */}
                            {isTeacherOrAdmin && (
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                <div
                                  className="relative inline-flex items-center gap-2 group"
                                  ref={actionRef}
                                >
                                  <span>Action</span>
                                  <button
                                    type="button"
                                    onClick={() => setActionOpen((p) => !p)}
                                    className="text-gray-500 hover:text-gray-800"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>

                                  <div
                                    className={`absolute left-0 top-8 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 transition-all duration-150 ${
                                      actionOpen
                                        ? "opacity-100 visible"
                                        : "opacity-0 invisible"
                                    }`}
                                  >
                                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                      <p className="text-sm font-semibold text-gray-700">Filter</p>
                                      <button
                                        onClick={() => clearSet(setActionFilter)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Clear
                                      </button>
                                    </div>

                                    <div className="p-3 space-y-2 max-h-60 overflow-auto">
                                      {actionOptions.map((opt) => (
                                        <label
                                          key={opt.value}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={actionFilter.has(opt.value)}
                                            onChange={() => toggleSetItem(setActionFilter, opt.value)}
                                            className="w-4 h-4 rounded border-gray-300"
                                          />
                                          <span className="text-sm text-gray-700">{opt.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </th>
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {filteredStudents.map((enrollment, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                              {isTeacherOrAdmin && (
                                <td className="px-6 py-4 text-sm">
                                  {enrollment.enrol_status === "pending instructor approval" && (
                                    <input
                                      type="checkbox"
                                      checked={selectedForApproval.has(enrollment.enrollment_id)}
                                      onChange={() => {
                                        const newSet = new Set(selectedForApproval);
                                        if (newSet.has(enrollment.enrollment_id)) {
                                          newSet.delete(enrollment.enrollment_id);
                                        } else {
                                          newSet.add(enrollment.enrollment_id);
                                        }
                                        setSelectedForApproval(newSet);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300"
                                    />
                                  )}

                                  {enrollment.enrol_status === "enrolled" &&
                                    statusFilter.has("pending instructor approval") && (
                                      <Check className="w-5 h-5 text-green-600" />
                                    )}
                                </td>
                              )}

                              <td className="px-6 py-4 text-sm text-gray-900">
                                {enrollment.student_name || "N/A"}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                <div className="max-w-[220px] truncate" title={enrollment.student_email || ""}>
                                  {enrollment.student_email || "N/A"}
                                </div>
                              </td>



                              <td className="px-6 py-4 text-sm">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                                  enrollment.enrol_type === "Credit"
                                    ? "bg-blue-100 text-blue-800"
                                    : enrollment.enrol_type === "Credit for Concentration"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : enrollment.enrol_type === "Audit"
                                    ? "bg-purple-100 text-purple-800"
                                    : enrollment.enrol_type === "Remedial"
                                    ? "bg-pink-100 text-pink-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {enrollment.enrol_type || "N/A"}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                                    enrollment.enrol_status === "enrolled"
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : enrollment.enrol_status === "completed"
                                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                                      : enrollment.enrol_status === "pending instructor approval"
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                      : enrollment.enrol_status === "pending advisor approval"
                                      ? "bg-orange-100 text-orange-800 border border-orange-300"
                                      : enrollment.enrol_status === "instructor rejected"
                                      ? "bg-red-100 text-red-800 border border-red-300"
                                      : "bg-gray-100 text-gray-800 border border-gray-300"
                                  }`}
                                >
                                  {enrollment.enrol_status?.replaceAll("_", " ") || "N/A"}
                                </span>
                              </td>

                              {isTeacherOrAdmin && (
                                <td className="px-6 py-4 text-sm">
                                  {enrollment.enrol_status === "pending instructor approval" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApproveStudent(enrollment)}
                                        disabled={approving === enrollment.enrollment_id}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                                      >
                                        {approving === enrollment.enrollment_id
                                          ? "Approving..."
                                          : "Approve"}
                                      </button>

                                      <button
                                        onClick={() => handleRejectStudent(enrollment)}
                                        disabled={approving === enrollment.enrollment_id}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsPage;
