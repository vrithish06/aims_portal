import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import {
  Users,
  ArrowLeft,
  ChevronDown,
  Check,
  GraduationCap,
  Search,
  User,
  LayoutGrid,
  ClipboardList,
  BookOpen,
  X,
  PieChart,
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

/* ================= MAIN COMPONENT ================= */
function CourseDetailsPage() {
  const { offeringId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [offering, setOffering] = useState(location.state?.offering || null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(!offering);
  const [activeTab, setActiveTab] = useState("main");

  // Filters
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [showOnlyEnrolled, setShowOnlyEnrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Approval states
  const [approveAllLoading, setApproveAllLoading] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isTeacherOrAdmin = user?.role === "instructor" || user?.role === "admin";

  const isOfferingInstructor = useMemo(() => {
    if (!offering || !user?.user_id) return false;
    return (
      user.role === "admin" ||
      offering.instructors?.some(
        (i) =>
          String(user.user_id) === String(i.user_id) ||
          String(user.user_id) === String(i.users?.id) ||
          String(user.user_id) === String(i.users?.user_id)
      ) ||
      (offering.instructor &&
        (String(user.user_id) === String(offering.instructor.user_id) ||
          String(user.user_id) === String(offering.instructor.users?.id) ||
          String(user.user_id) === String(offering.instructor.users?.user_id)))
    );
  }, [offering, user]);

  // Offering status dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const offeringStatusRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (offeringStatusRef.current && !offeringStatusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!offering) {
      fetchOfferingDetails();
    } else {
      fetchEnrolledStudents();
    }
  }, [offeringId]);

  const fetchOfferingDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/offering/${offeringId}`);
      if (res.data.success) {
        setOffering(res.data.data);
        fetchEnrolledStudents();
      }
    } catch (err) {
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const res = await axiosClient.get(`/offering/${offeringId}/enrollments`);
      if (res.data.success) {
        setEnrolledStudents(res.data.data || []);
      }
    } catch (err) {
      setEnrolledStudents([]);
    }
  };

  const clearAllFilters = () => {
    setEnrollmentTypeFilter(new Set());
    setStatusFilter(new Set());
    setSearchQuery("");
    setShowOnlyEnrolled(false);
  };

  const normalizeStr = (val) => (val ?? "").toString().toLowerCase().trim();

  const filteredStudents = useMemo(() => {
    const query = normalizeStr(searchQuery);
    return enrolledStudents.filter((s) => {
      const typeMatch = enrollmentTypeFilter.size === 0 || enrollmentTypeFilter.has(s.enrol_type);
      const statusMatch = statusFilter.size === 0 || statusFilter.has(s.enrol_status);
      const searchMatch =
        query.length === 0 ||
        [s.student_name, s.student_email, s.enrol_status].map(normalizeStr).some((f) => f.includes(query));
      const enrolledOnlyMatch = !showOnlyEnrolled || s.enrol_status === "enrolled";

      return typeMatch && statusMatch && searchMatch && enrolledOnlyMatch;
    });
  }, [enrolledStudents, searchQuery, enrollmentTypeFilter, statusFilter, showOnlyEnrolled]);

  const handleBulkApproveFiltered = async () => {
    const pending = filteredStudents.filter((s) => s.enrol_status === "pending instructor approval");
    if (pending.length === 0) {
      toast.error("No pending students to approve in current view");
      return;
    }

    if (!window.confirm(`Approve ${pending.length} pending student(s)?`)) return;

    try {
      setApproveAllLoading(true);
      const promises = pending.map((s) =>
        axiosClient.put(`/offering/${offeringId}/enrollments/${s.enrollment_id}`, {
          enrol_status: "pending advisor approval",
        })
      );
      await Promise.all(promises);
      toast.success(`Approved ${pending.length} student(s)`);
      fetchEnrolledStudents();
    } catch (err) {
      toast.error("Bulk approval failed");
    } finally {
      setApproveAllLoading(false);
    }
  };

  const handleApproveStudent = async (enrollment) => {
    try {
      await axiosClient.put(`/offering/${offeringId}/enrollments/${enrollment.enrollment_id}`, {
        enrol_status: "pending advisor approval",
      });
      toast.success("Approved → Pending advisor");
      fetchEnrolledStudents();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const handleRejectStudent = async (enrollment) => {
    try {
      await axiosClient.put(`/offering/${offeringId}/enrollments/${enrollment.enrollment_id}`, {
        enrol_status: "instructor rejected",
      });
      toast.success("Rejected");
      fetchEnrolledStudents();
    } catch (err) {
      toast.error("Rejection failed");
    }
  };

  const handleUpdateOfferingStatus = async (newStatus) => {
    try {
      const res = await axiosClient.put(`/offering/${offeringId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        setOffering((prev) => ({ ...prev, status: newStatus }));
        setStatusDropdownOpen(false);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Course not found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const course = offering.course;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER + TABS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase">
                  {course?.code}
                </span>
                <span className="text-slate-500 text-sm">{offering.acad_session}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {course?.title}
              </h1>
            </div>
          </div>

          {/* Status Indicator / Dropdown */}
          {isOfferingInstructor ? (
            <div className="relative" ref={offeringStatusRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${offering.status === "Enrolling"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : offering.status === "Canceled"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${offering.status === "Enrolling" ? "bg-emerald-500" : "bg-slate-400"
                    } animate-pulse`}
                />
                {offering.status}
                <ChevronDown className="w-4 h-4" />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5">
                  {["Enrolling", "Running", "Completed", "Canceled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateOfferingStatus(s)}
                      className="w-full text-left px-5 py-2.5 text-sm hover:bg-slate-50 transition-colors capitalize"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${offering.status === "Enrolling"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : offering.status === "Canceled"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${offering.status === "Enrolling" ? "bg-emerald-500" : "bg-slate-400"
                  }`}
              />
              {offering.status}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex border-b border-slate-100">
          {[
            { id: "main", label: "Main", icon: LayoutGrid },
            { id: "enrollments", label: "Enrollments", icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-7 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/60"
                }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8">
        {/* MAIN TAB */}
        {activeTab === "main" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN - Course Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info Section */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-lg">Course Information</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Credits (L-T-P)</span>
                    <span className="text-base font-semibold text-slate-900 mt-1 sm:mt-0">{course?.ltp || "—"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Slot</span>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700">
                        {offering.slot || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Section</span>
                    <span className="text-base font-semibold text-slate-900 mt-1 sm:mt-0">{offering.section || "—"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Enrolled</span>
                    <span className="text-base font-semibold text-slate-900 mt-1 sm:mt-0">{enrolledStudents.length} Students</span>
                  </div>
                </div>
              </div>

              {/* Crediting Rules Section */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-lg">Enrollment Criteria</h3>
                </div>

                {offering.targets?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Degree / Branch</th>
                          <th className="px-6 py-3 font-semibold">Batch</th>
                          <th className="px-6 py-3 font-semibold text-right">Allowed Types</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {offering.targets.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {t.degree || "All"} / {t.branch || "All"}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{t.batch || "All"}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {t.offering_type?.map((type, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No specific enrollment criteria defined for this course.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - Instructors */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-lg">Course Instructor(s)</h3>
                </div>

                {offering.instructors?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {[...offering.instructors]
                      .sort((a, b) => (b.is_coordinator ? 1 : 0) - (a.is_coordinator ? 1 : 0))
                      .map((instr, idx) => (
                        <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200 shrink-0">
                              {instr.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{instr.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{instr.email}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{instr.branch || "Faculty"}</p>
                            </div>
                          </div>
                          {instr.is_coordinator && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                              Coordinator
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Instructor information to be announced.
                  </div>
                )}
              </div>

              {/* Additional Meta (Optional Placeholders) */}
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5">
                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course Description
                </h4>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  {course?.description || "No description provided for this course."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ENROLLMENTS TAB */}
        {activeTab === "enrollments" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student name or email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              </div>

              <FilterDropdown
                label="Type"
                options={["Credit", "Credit for Concentration", "Credit for Minor", "Credit for Audit"]}
                selected={enrollmentTypeFilter}
                setSelected={setEnrollmentTypeFilter}
              />

              <FilterDropdown
                label="Status"
                options={[
                  "pending instructor approval",
                  "pending advisor approval",
                  "enrolled",
                  "instructor rejected",
                  "advisor rejected",
                ]}
                selected={statusFilter}
                setSelected={setStatusFilter}
              />

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showOnlyEnrolled}
                  onChange={(e) => setShowOnlyEnrolled(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                Enrolled only
              </label>

              <div className="w-14 ml-2 flex justify-center">
                <button
                  onClick={clearAllFilters}
                  className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${enrollmentTypeFilter.size > 0 ||
                    statusFilter.size > 0 ||
                    searchQuery ||
                    showOnlyEnrolled
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
                    }`}
                >
                  Clear
                </button>
              </div>

              {isTeacherOrAdmin && filteredStudents.length > 0 && (
                <button
                  onClick={handleBulkApproveFiltered}
                  disabled={approveAllLoading || !filteredStudents.some(s => s.enrol_status === "pending instructor approval")}
                  className="btn btn-primary btn-sm ml-auto"
                >
                  {approveAllLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    `Approve ${filteredStudents.length}`
                  )}
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    <th className="px-6 py-4 text-left w-16">#</th>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-right">Status</th>
                    {isTeacherOrAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.enrollment_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {s.student_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{s.student_name}</div>
                            <div className="text-xs text-slate-500">{s.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg">
                          {s.enrol_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-lg uppercase ${s.enrol_status === "enrolled"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.enrol_status?.includes("pending")
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {s.enrol_status?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {isTeacherOrAdmin && (
                        <td className="px-6 py-4 text-right">
                          {s.enrol_status === "pending instructor approval" && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApproveStudent(s)}
                                className="btn btn-xs btn-success text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectStudent(s)}
                                className="btn btn-xs btn-error text-white"
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

              {filteredStudents.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">No students match current filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseDetailsPage;