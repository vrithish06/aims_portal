import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Plus, 
  Search, 
  X, 
  ListFilter, 
  Beaker, 
  Layers, 
  Hash,
  CheckCircle,
  XCircle
} from "lucide-react";

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
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    status: [],
    lab: [] 
  });
  const [filters, setFilters] = useState({
    status: [],
    lab: []
  });

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
    const matchesStatus = filters.status.length === 0 || filters.status.includes(course.status);

    // Lab Filter (Boolean to String mapping)
    const matchesLab = filters.lab.length === 0 || 
      (filters.lab.includes("Yes") && course.has_lab) || 
      (filters.lab.includes("No") && !course.has_lab);

    return matchesSearch && matchesStatus && matchesLab;
  });

  const toggleTempFilter = (category, value) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
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
    setFilters({ status: [], lab: [] });
    setTempFilters({ status: [], lab: [] });
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(f => f.length > 0) || searchQuery;
  };

  // Helper for Status Badge
  const getStatusStyle = (status) => {
    return status === "active" 
      ? "bg-green-100 text-green-700 border-green-200" 
      : "bg-gray-100 text-gray-600 border-gray-200";
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
        <div className="flex gap-3">
          <button
            onClick={toggleFilters}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors flex-shrink-0 ${
              showFilters 
                ? 'bg-amber-500 text-white border-amber-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
              placeholder="Search by code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
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
      <div className="p-4 flex gap-4">
        
        {/* Sidebar Filters */}
        {showFilters && (
          <div className="w-80 flex-shrink-0" onKeyPress={(e) => e.key === 'Enter' && applyFilters()}>
            <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {Object.values(tempFilters).some(f => f.length > 0) && (
                  <button
                    onClick={() => setTempFilters({ status: [], lab: [] })}
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
                  {getUniqueValues('status').map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.status.includes(status)}
                        onChange={() => toggleTempFilter('status', status)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lab Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Has Lab?</h4>
                <div className="space-y-2">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.lab.includes(opt)}
                        onChange={() => toggleTempFilter('lab', opt)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
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

        {/* Content Area */}
        <div className="flex-1">
          {/* Active Filter Banner */}
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

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredCourses.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No courses found</h3>
              <p className="text-gray-500 mt-2">
                {hasActiveFilters() ? "Try adjusting your filters or search." : "No courses are currently available."}
              </p>
              {user?.role === "admin" && !hasActiveFilters() && (
                <button
                  onClick={() => navigate("/course-add")}
                  className="mt-4 btn btn-primary gap-2"
                >
                  <Plus size={20} />
                  Create First Course
                </button>
              )}
            </div>
          )}

          {/* Card Grid */}
          {!loading && filteredCourses.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filteredCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden relative"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <span className="inline-block text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2">
                          {course.code}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap ${getStatusStyle(course.status)}`}>
                        {course.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* LTP Box */}
                      <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3 border border-purple-100">
                        <div className="bg-white p-1.5 rounded-md shadow-sm text-purple-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-purple-600 tracking-wide">LTP Structure</p>
                          <p className="text-sm font-bold text-gray-800">{course.ltp || "N/A"}</p>
                        </div>
                      </div>

                      {/* Lab Box */}
                      <div className={`rounded-lg p-3 flex items-center gap-3 border ${course.has_lab ? 'bg-teal-50 border-teal-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="bg-white p-1.5 rounded-md shadow-sm text-gray-600">
                          <Beaker className={`w-4 h-4 ${course.has_lab ? 'text-teal-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase font-bold tracking-wide ${course.has_lab ? 'text-teal-600' : 'text-gray-500'}`}>Lab Comp.</p>
                          <div className="flex items-center gap-1">
                            {course.has_lab ? (
                              <span className="text-sm font-bold text-teal-700">Yes</span>
                            ) : (
                              <span className="text-sm font-bold text-gray-500">No</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-0 mt-auto">
                    <div className="w-full py-2 bg-gray-50 text-gray-400 text-center text-xs font-medium rounded-lg border border-gray-100 flex items-center justify-center gap-2">
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
    </div>
  );
}

export default CoursesPage;