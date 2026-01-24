import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { Users, ArrowLeft, BookOpen, ChevronDown, Check, GraduationCap, Search, X, User, PieChart, LayoutGrid, ClipboardList } from "lucide-react";

function CourseDetailsPage() {
  const { offeringId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [offering, setOffering] = useState(location.state?.offering || null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(!offering);
  const [activeTab, setActiveTab] = useState("main");

  // ✅ Multi-select Filters (Set)
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [actionFilter, setActionFilter] = useState(new Set());
  const [showOnlyEnrolled, setShowOnlyEnrolled] = useState(false);

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
    (user?.user_id && (
      (offering?.instructors?.some(i =>
        String(user.user_id) === String(i.user_id) ||
        String(user.user_id) === String(i.users?.id) ||
        String(user.user_id) === String(i.users?.user_id)
      )) ||
      (offering?.instructor && (
        String(user.user_id) === String(offering.instructor.user_id) ||
        String(user.user_id) === String(offering.instructor.users?.id) ||
        String(user.user_id) === String(offering.instructor.users?.user_id)
      ))
    ));

  const offeringStatusRef = useRef(null);

  useEffect(() => {
    if (!offering) {
      fetchOfferingDetails();
    } else {
      fetchEnrolledStudents();
    }
  }, [offeringId]);

  useEffect(() => {
    const handler = (e) => {
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
        setOffering(response.data.data);
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error("Failed to load course details");
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
      setEnrolledStudents([]);
    }
  };

  const clearAllFilters = () => {
    setEnrollmentTypeFilter(new Set());
    setStatusFilter(new Set());
    setActionFilter(new Set());
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
        toast.success("Approved. Pending advisor approval.");
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error("Failed to approve");
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
        toast.success("Rejected.");
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    const pending = filteredStudents.filter(s => s.enrol_status === "pending instructor approval");
    if (pending.length === 0) return;
    try {
      setApproveAll(true);
      const promises = pending.map(s => axiosClient.put(`/offering/${offeringId}/enrollments/${s.enrollment_id}`, { enrol_status: "pending advisor approval" }));
      await Promise.all(promises);
      toast.success("All pending students processed.");
      fetchEnrolledStudents();
    } catch (error) {
      toast.error("Bulk process failed");
    } finally {
      setApproveAll(false);
    }
  };

  const handleUpdateOfferingStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const response = await axiosClient.put(`/offering/${offeringId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Status: ${newStatus}`);
        setOffering(prev => ({ ...prev, status: newStatus }));
        setStatusDropdownOpen(false);
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const normalizeStr = (val) => (val ?? "").toString().toLowerCase().trim();

  const filteredStudents = useMemo(() => {
    const query = normalizeStr(searchQuery);
    return enrolledStudents.filter(s => {
      const typeMatch = enrollmentTypeFilter.size === 0 || enrollmentTypeFilter.has(s.enrol_type);
      const statusMatch = statusFilter.size === 0 || statusFilter.has(s.enrol_status);
      const searchMatch = query.length === 0 || [s.student_name, s.student_email, s.enrol_status].map(normalizeStr).some(f => f.includes(query));
      const enrolledOnlyMatch = !showOnlyEnrolled || s.enrol_status === 'enrolled';
      return typeMatch && statusMatch && searchMatch && enrolledOnlyMatch;
    });
  }, [enrolledStudents, searchQuery, enrollmentTypeFilter, statusFilter, showOnlyEnrolled]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
  if (!offering) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><h2 className="text-xl font-bold">Not found</h2><button onClick={() => navigate(-1)} className="mt-4 text-blue-600">Go Back</button></div>;

  const course = offering.course;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-blue-600 py-0.5 px-2 bg-blue-50 rounded-md uppercase tracking-tight">{course?.code}</span>
                <span className="text-slate-400 text-sm">{offering.acad_session}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course?.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOfferingInstructor ? (
              <div className="relative" ref={offeringStatusRef}>
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  disabled={statusUpdating}
                  className={`pl-4 pr-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all border ${offering.status === "Enrolling" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    offering.status === "Canceled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${offering.status === 'Enrolling' ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
                  {offering.status}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {["Enrolling", "Running", "Completed", "Canceled"].map((s) => (
                      <button key={s} onClick={() => handleUpdateOfferingStatus(s)} className="w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors capitalize">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 bg-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {offering.status}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center gap-1 border-b-[0px]">
            {[
              { id: "main", label: "Main", icon: LayoutGrid },
              { id: "enrollments", label: "Enrollments", icon: ClipboardList }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? "text-blue-600 bg-blue-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-600" : "text-slate-300"}`} />
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8">

        {/* TAB 1: MAIN (DETAILS) */}
        {activeTab === "main" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column: Course Details */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Hero Card */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {offering.acad_session}
                      </span>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${offering.status === 'Running' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        offering.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {offering.status}
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                      {course?.title}
                    </h2>
                    <div className="flex items-center gap-3 text-slate-500 font-bold text-lg">
                      <span className="text-blue-600">{course?.code}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>{offering.dept_name}</span>
                    </div>

                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Credits (L-T-P)</p>
                        <p className="text-lg font-black text-slate-900">{course?.ltp}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Slot</p>
                        <p className="text-lg font-black text-slate-900">{offering.slot || "N/A"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Section</p>
                        <p className="text-lg font-black text-slate-900">{offering.section || "N/A"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Total Enrolled</p>
                        <p className="text-lg font-black text-slate-900">{enrolledStudents.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crediting Categorization */}
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Crediting Categorization</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    {offering.targets && offering.targets.length > 0 ? (
                      <div className="grid gap-4">
                        {offering.targets.map((t, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all bg-slate-50/30 gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-slate-900">{t.degree || "All Degrees"}</span>
                                  <span className="text-slate-300">/</span>
                                  <span className="text-sm font-medium text-slate-600">{t.branch || "All Branches"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Batch: {t.batch || "All"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pl-14 md:pl-0">
                              {t.offering_type?.map((type, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100/50">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-40">
                        <p className="text-sm font-bold text-slate-400">No specific credit categorization rules set.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Instructor Table */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm h-full flex flex-col text-slate-900">
                  <div className="px-8 py-8 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Instructors</h4>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    {offering.instructors?.map((instr, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-blue-100 transition-colors group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center font-bold text-sm text-slate-500 shadow-sm border border-slate-200">
                          {instr.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-bold text-sm truncate pr-2 text-slate-900">{instr.name}</h5>
                            {instr.is_coordinator && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                COORDINATOR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 mb-0.5">{instr.branch}</p>
                          <p className="text-[11px] text-blue-600 truncate opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">{instr.email}</p>
                        </div>
                      </div>
                    ))}

                    {(!offering.instructors || offering.instructors.length === 0) && (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                        <User className="w-8 h-8 mb-2 text-slate-300" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Instructors</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Active Faculty Access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENROLLMENTS */}
        {activeTab === "enrollments" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 uppercase tracking-tighter">Registered Students</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">{enrolledStudents.length} Cumulative Records</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 mr-2">
                    <input
                      type="checkbox"
                      id="enrolledFilter"
                      checked={showOnlyEnrolled}
                      onChange={(e) => setShowOnlyEnrolled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="enrolledFilter" className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer">
                      Enrolled Only
                    </label>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student profile..."
                      className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold w-full md:w-80 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                  {isTeacherOrAdmin && filteredStudents.some(s => s.enrol_status === "pending instructor approval") && (
                    <button
                      onClick={handleApproveAll}
                      disabled={approveAll}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                    >
                      {approveAll ? "Processing..." : "Commit All Pending"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6">
                        <th className="px-8 pb-2 w-16">S#</th>
                        <th className="px-8 pb-2">Academic Profile</th>
                        <th className="px-8 pb-2 text-center">Registration Type</th>
                        <th className="px-8 pb-2 text-right">Fulfillment Track</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((enrollment, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                          <td className="px-8 py-6 bg-slate-50 group-hover:bg-white rounded-l-[1.5rem] mt-2 border-l border-y border-transparent group-hover:border-slate-100 font-bold text-slate-400 text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-8 py-6 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-slate-200 flex flex-shrink-0 items-center justify-center text-slate-500 font-black text-sm uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {enrollment.student_name?.charAt(0) || "S"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-black text-slate-900 leading-none mb-1.5">{enrollment.student_name}</h4>
                                <p className="text-xs font-bold text-slate-400 tracking-tight truncate max-w-[250px]">{enrollment.student_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                            <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                              {enrollment.enrol_type}
                            </span>
                          </td>
                          <td className="px-8 py-6 bg-slate-50 group-hover:bg-white rounded-r-[1.5rem] border-r border-y border-transparent group-hover:border-slate-100">
                            <div className="flex flex-col items-end gap-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${enrollment.enrol_status === "enrolled" ? "bg-emerald-500" :
                                  enrollment.enrol_status?.includes("pending") ? "bg-amber-400" : "bg-slate-300"
                                  }`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-700">
                                  {enrollment.enrol_status?.replaceAll("_", " ")}
                                </span>
                              </div>
                              {isTeacherOrAdmin && enrollment.enrol_status === "pending instructor approval" && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleApproveStudent(enrollment)} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase rounded-lg border border-emerald-100">
                                    Approve
                                  </button>
                                  <button onClick={() => handleRejectStudent(enrollment)} className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase rounded-lg border border-rose-100">
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center text-center opacity-30">
                    <Users className="w-16 h-16 mb-4 text-slate-300" />
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Applications Found</h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default CourseDetailsPage;
