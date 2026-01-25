import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import {
  Users,
  AlertCircle,
  ArrowRight,
  Search,
  Check,
  ChevronDown,
  X,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function FacultyAdviseesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [advisees, setAdvisees] = useState([]);
  const [advisorInfo, setAdvisorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(new Set());

  useEffect(() => {
    fetchAdvisees();
  }, []);

  const fetchAdvisees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/enrollment/advisees');

      if (response.data.success) {
        setAdvisees(response.data.data || []);
        setAdvisorInfo(response.data.advisorInfo);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching advisees:', err);
      setError(err.response?.data?.message || 'Failed to load advisees');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (studentId) => {
    navigate(`/faculty-advisees/${studentId}`);
  };

  const getUniqueValues = (key) => {
    return [...new Set(advisees.map(a => a[key]).filter(Boolean))].sort();
  };

  const filteredAdvisees = advisees.filter(student => {
    const name = `${student.users?.first_name} ${student.users?.last_name}`.toLowerCase();
    const email = student.users?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || name.includes(query) || email.includes(query);
    const matchesBranch = branchFilter.size === 0 || branchFilter.has(student.branch);

    return matchesSearch && matchesBranch;
  });

  const clearAllFilters = () => {
    setBranchFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return branchFilter.size > 0 || searchQuery;
  };

  if (!user || user.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">Only instructors can view their advisees.</p>
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
            Faculty Advisees
          </h1>
          <p className="text-lg text-gray-600">
            View all students assigned under your advisory
            {advisorInfo && (
              <span className="ml-2 text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                {advisorInfo.degree} • {advisorInfo.branch} • Batch {advisorInfo.batch}
              </span>
            )}
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>

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
          <div className="flex flex-col justify-center items-center py-40">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching your advisees...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Error Loading Advisees</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAdvisees.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No advisees found</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {hasActiveFilters() ? "Try adjusting your filters or search." : "You have no assigned advisees yet."}
            </p>
          </div>
        )}

        {/* Advisees Grid */}
        {!loading && !error && filteredAdvisees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAdvisees.map((student) => (
              <div
                key={student.student_id}
                onClick={() => handleStudentClick(student.student_id)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
              >
                {/* Student Name */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {student.users?.first_name} {student.users?.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{student.users?.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm flex-shrink-0">
                    {student.users?.first_name?.charAt(0)}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">CGPA</p>
                      <p className="text-xs font-bold text-slate-700">{student.cgpa?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Credits</p>
                      <p className="text-xs font-bold text-slate-700">{student.total_credits_completed || 0}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Branch</p>
                      <p className="text-xs font-bold text-blue-700">{student.branch || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Enrollment Status */}
                  {student.enrollments && student.enrollments.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Enrollments ({student.enrollments.length})
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                        {student.enrollments.map((enrollment, idx) => (
                          <div
                            key={enrollment.enrollment_id}
                            className="text-[10px] bg-slate-50 px-2 py-1.5 rounded border border-slate-100 flex justify-between items-center gap-2"
                          >
                            <span className="text-slate-600 font-medium truncate flex-1" title={enrollment.course_offering?.course?.code}>
                              {enrollment.course_offering?.course?.code || 'Unknown'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-[4px] font-bold whitespace-nowrap border ${enrollment.enrol_status === 'enrolled'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : enrollment.enrol_status?.includes('pending')
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                            >
                              {enrollment.enrol_status === 'enrolled' ? 'Enrolled' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 pt-0 mt-auto">
                  <button className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wide shadow-md shadow-blue-200 hover:bg-blue-700 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
