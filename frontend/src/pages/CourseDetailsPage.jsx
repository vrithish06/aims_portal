import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
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
  Download,
  Upload,
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
          <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full">
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
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  selected.has(opt)
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

  // Excel upload/download states
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  // Download enrolled students as Excel (only students with enrolled status)
  const handleDownloadExcel = () => {
    try {
      // Filter only students with "enrolled" status
      const enrolledOnlyStudents = enrolledStudents.filter((s) => s.enrol_status === "enrolled");

      if (enrolledOnlyStudents.length === 0) {
        toast.error("No enrolled students to download");
        return;
      }

      // Prepare data for Excel
      const data = enrolledOnlyStudents.map((s) => ({
        "Student Name": s.student_name,
        "Student Email": s.student_email,
        "Enrollment Type": s.enrol_type,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Enrollments");

      // Set column widths
      worksheet["!cols"] = [
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
      ];

      // Download file
      XLSX.writeFile(
        workbook,
        `${course?.code || "Course"}_Enrollments_${offering.acad_session || "Session"}.xlsx`
      );

      toast.success(`Excel file downloaded (${enrolledOnlyStudents.length} enrolled student(s))`);
    } catch (err) {
      toast.error("Failed to download Excel");
    }
  };

  // Handle Excel file upload
  const handleUploadExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      
      // First, test if session is valid
      console.log("[UPLOAD] Testing session state before upload...");
      try {
        const testResponse = await axiosClient.get(`/offering/${offeringId}/upload-test`);
        console.log("[UPLOAD] Session test passed:", testResponse.data);
      } catch (testErr) {
        console.error("[UPLOAD] Session test FAILED:", {
          status: testErr.response?.status,
          message: testErr.response?.data?.message
        });
        toast.error("Session invalid. Please refresh the page and try again.");
        setUploadLoading(false);
        return;
      }
      
      // Read Excel file
      const reader = new FileReader();
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploadLoading(false);
      };

      reader.onload = async (event) => {
        try {
          const binaryStr = event.target?.result;
          console.log("[UPLOAD] File read successfully, size:", binaryStr?.length);

          const workbook = XLSX.read(binaryStr, { type: "binary" });
          console.log("[UPLOAD] Workbook parsed, sheets:", workbook.SheetNames);

          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log("[UPLOAD] Data parsed, rows:", jsonData.length);
          console.log("[UPLOAD] First row:", jsonData[0]);

          // Validate data format
          if (!jsonData || jsonData.length === 0) {
            toast.error("Excel file is empty");
            setUploadLoading(false);
            return;
          }

          const requiredColumns = ["Student Name", "Student Email", "Enrollment Type", "Grade"];
          const firstRow = jsonData[0];
          const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

          if (missingColumns.length > 0) {
            toast.error(`Missing columns: ${missingColumns.join(", ")}`);
            setUploadLoading(false);
            return;
          }

          console.log("[UPLOAD] Validation passed, all columns present");

          // Process and upload grades
          const gradesData = jsonData.map((row) => ({
            student_name: row["Student Name"],
            student_email: row["Student Email"],
            enrol_type: row["Enrollment Type"],
            grade: String(row["Grade"]).trim(),
          }));

          console.log("[UPLOAD] Sending grades data to backend:", {
            offeringId,
            count: gradesData.length,
            sample: gradesData[0]
          });

          // Send to backend
          try {
            console.log("[UPLOAD] Making axios POST request...");
            const response = await axiosClient.post(
              `/offering/${offeringId}/upload-grades`,
              { grades: gradesData }
            );

            console.log("[UPLOAD] Response received:", response.status, response.data);

            if (response.data.success) {
              toast.success(`✓ Grades updated for ${response.data.updatedCount} student(s)`);
              
              // Show errors if any
              if (response.data.errors && response.data.errors.length > 0) {
                console.warn("[UPLOAD] Errors during update:", response.data.errors);
                toast.error(`⚠ ${response.data.errors.length} student(s) failed: ${response.data.errors[0]}`);
              }

              // Refresh the list
              await fetchEnrolledStudents();
            } else {
              console.error("[UPLOAD] API returned failure:", response.data);
              toast.error(response.data.message || "Failed to update grades");
            }
          } catch (axiosErr) {
            console.error("[UPLOAD] Axios error details:", {
              status: axiosErr.response?.status,
              message: axiosErr.response?.data?.message || axiosErr.message,
              fullResponse: axiosErr.response?.data,
              config: {
                method: axiosErr.config?.method,
                url: axiosErr.config?.url,
                headers: axiosErr.config?.headers
              }
            });
            
            if (axiosErr.response?.status === 401) {
              toast.error("Authentication failed. Please refresh and try again.");
            } else {
              toast.error(`Error: ${axiosErr.response?.data?.message || axiosErr.message}`);
            }
            throw axiosErr;
          }
        } catch (parseErr) {
          console.error("[UPLOAD] Error:", parseErr);
          toast.error(`Error: ${parseErr.message || "Failed to parse Excel file"}`);
        } finally {
          setUploadLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      console.error("[UPLOAD] Outer error:", err);
      toast.error("Failed to process file");
      setUploadLoading(false);
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
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${
                  offering.status === "Enrolling"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : offering.status === "Canceled"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    offering.status === "Enrolling" ? "bg-emerald-500" : "bg-slate-400"
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
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${
                offering.status === "Enrolling"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : offering.status === "Canceled"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  offering.status === "Enrolling" ? "bg-emerald-500" : "bg-slate-400"
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
              className={`flex items-center gap-2 px-7 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id
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
          <div className="space-y-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Credits (L-T-P)</p>
                <p className="text-2xl font-black text-slate-900">{course?.ltp || "—"}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Slot</p>
                <p className="text-2xl font-black text-slate-900">{offering.slot || "N/A"}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Section</p>
                <p className="text-2xl font-black text-slate-900">{offering.section || "—"}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Enrolled</p>
                <p className="text-2xl font-black text-slate-900">{enrolledStudents.length}</p>
              </div>
            </div>

            {/* Crediting Targets */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/70">
                <h3 className="text-lg font-bold text-slate-800">Crediting Categorization</h3>
              </div>
              <div className="p-6">
                {offering.targets?.length > 0 ? (
                  <div className="space-y-4">
                    {offering.targets.map((t, i) => (
                      <div
                        key={i}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {t.degree || "All Degrees"} / {t.branch || "All Branches"}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Batch: {t.batch || "All"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {t.offering_type?.map((type, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No specific crediting rules defined.
                  </div>
                )}
              </div>
            </div>

            {/* Instructors */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/70">
                <h3 className="text-lg font-bold text-slate-800">Instructors</h3>
              </div>
              <div className="p-6">
                {offering.instructors?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {offering.instructors.map((instr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                          {instr.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{instr.name}</div>
                          {instr.is_coordinator && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md mt-1 inline-block">
                              Coordinator
                            </span>
                          )}
                          <div className="text-sm text-slate-600 mt-1">{instr.branch}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">No instructors assigned</div>
                )}
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

              {(enrollmentTypeFilter.size > 0 ||
                statusFilter.size > 0 ||
                searchQuery ||
                showOnlyEnrolled) && (
                <button
                  onClick={clearAllFilters}
                  className="btn btn-ghost btn-sm text-slate-600"
                >
                  Clear
                </button>
              )}

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

              {isTeacherOrAdmin && filteredStudents.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    className="btn btn-outline btn-sm gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                    title="Download enrolled students as Excel"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="btn btn-outline btn-sm gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                    title="Upload grades from Excel"
                  >
                    {uploadLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Grades
                      </>
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleUploadExcel}
                    className="hidden"
                  />
                </div>
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
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-lg uppercase ${
                            s.enrol_status === "enrolled"
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