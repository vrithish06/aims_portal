import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Beaker,
  Layers,
  Hash,
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

function CoursesPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  // Data States
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [labFilter, setLabFilter] = useState(new Set());

  // Handle Success Message from Navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchCourses();
  }, [isAuthenticated, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/courses/all");

      if (res.data.success) {
        setCourses(res.data.data || []);
      } else {
        setError("Failed to fetch courses");
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // --- Filter Logic ---

  const getUniqueValues = (key) => {
    return [...new Set(courses.map(c => c[key]).filter(Boolean))].sort();
  };

  const filteredCourses = courses.filter(course => {
    // Search
    const matchesSearch = !searchQuery ||
      (course.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status Filter
    const matchesStatus = statusFilter.size === 0 || statusFilter.has(course.status);

    // Lab Filter (Boolean to String mapping helper)
    const matchesLab = labFilter.size === 0 ||
      (labFilter.has("Yes") && course.has_lab) ||
      (labFilter.has("No") && !course.has_lab);

    return matchesSearch && matchesStatus && matchesLab;
  });

  const clearAllFilters = () => {
    setStatusFilter(new Set());
    setLabFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return statusFilter.size > 0 || labFilter.size > 0 || searchQuery;
  };

  // Helper for Status Badge
  const getStatusStyle = (status) => {
    return status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full Width */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
            <BookOpen className="w-8 h-8 text-blue-600" />
            All Courses
          </h1>
          <p className="text-lg text-gray-600">
            Total courses available: {courses.length}
          </p>
        </div>

        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/course-add")}
            className="btn bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 shadow-sm"
          >
            <Plus size={20} />
            Add New Course
          </button>
        )}
      </div>

      {/* Search Bar & Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>

          <FilterDropdown
            label="Status"
            options={getUniqueValues('status')}
            selected={statusFilter}
            setSelected={setStatusFilter}
          />
          <FilterDropdown
            label="Has Lab?"
            options={['Yes', 'No']}
            selected={labFilter}
            setSelected={setLabFilter}
          />

          <div className="w-14 ml-2 flex justify-center">
            <button
              onClick={clearAllFilters}
              className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${statusFilter.size > 0 || labFilter.size > 0 || searchQuery
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
                }`}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Success Message Alert */}
      {successMessage && (
        <div className="px-6 pt-4">
          <div className="alert alert-success shadow-sm rounded-lg">
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8 px-4 w-full">
        {/* Active Filter Banner */}
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

        {/* Loading */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-40">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching all courses...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {hasActiveFilters() ? "Try adjusting your filters or search." : "No courses are currently available."}
            </p>
            {user?.role === "admin" && !hasActiveFilters() && (
              <button
                onClick={() => navigate("/course-add")}
                className="mt-6 btn bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 shadow-md shadow-blue-200"
              >
                <Plus size={20} />
                Create First Course
              </button>
            )}
          </div>
        )}

        {/* Card Grid */}
        {!loading && filteredCourses.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => (
              <div
                key={course.course_id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden relative"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mb-2">
                        {course.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex-shrink-0 ${getStatusStyle(course.status)}`}>
                      {course.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 space-y-5">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">

                    {/* LTP Box */}
                    <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 border border-slate-100">
                      <div className="bg-white p-1.5 rounded-md shadow-sm text-purple-600 border border-slate-100">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide leading-none mb-1">Structure</span>
                        <span className="text-sm font-bold text-slate-700 leading-none">{course.ltp || "N/A"}</span>
                      </div>
                    </div>

                    {/* Lab Box */}
                    <div className={`rounded-lg p-3 flex items-center gap-3 border ${course.has_lab ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="bg-white p-1.5 rounded-md shadow-sm text-slate-600 border border-slate-100">
                        <Beaker className={`w-4 h-4 ${course.has_lab ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[9px] uppercase font-bold tracking-wide leading-none mb-1 ${course.has_lab ? 'text-emerald-700' : 'text-slate-400'}`}>Lab</span>
                        <span className={`text-sm font-bold leading-none ${course.has_lab ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {course.has_lab ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 pt-0 mt-auto">
                  <div className="w-full py-2 bg-slate-50 text-slate-400 text-center text-[10px] font-bold uppercase tracking-wide rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                    <Hash className="w-3 h-3" />
                    ID: {course.course_id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoursesPage;