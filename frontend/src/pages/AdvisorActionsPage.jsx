import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Clock,
  Check,
  X,
  ArrowLeft,
  AlertCircle,
  Users,
  ArrowRight,
  Mail,
  Search,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

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

// Main Page - List of Students Pending Advisor Approval
function AdvisorActionsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advisorInfo, setAdvisorInfo] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }

    fetchPendingAdvisorEnrollments();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingAdvisorEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/enrollment/pending-advisor');
      let allEnrollments = response.data.data || [];
      setAdvisorInfo(response.data.advisorInfo);

      // Filter only pending advisor approval status
      allEnrollments = allEnrollments.filter(
        e => e.enrol_status === 'pending advisor approval'
      );

      setEnrollments(allEnrollments);
    } catch (err) {
      console.error('Error fetching pending advisor enrollments:', err);
      if (err.response?.status === 404) {
        setError('You are not assigned as a faculty advisor.');
      } else {
        setError(err.response?.data?.message || 'Failed to load pending enrollments');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUniqueValues = (key) => {
    // Handling nested or direct
    if (key === 'branch') return [...new Set(enrollments.map(e => e.student?.branch).filter(Boolean))].sort();
    if (key === 'enrol_type') return [...new Set(enrollments.map(e => e.enrol_type).filter(Boolean))].sort();
    return [];
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const studentName = `${enrollment.student?.users?.first_name} ${enrollment.student?.users?.last_name}`.toLowerCase();
    const studentEmail = enrollment.student?.users?.email?.toLowerCase() || "";
    const courseCode = enrollment.course?.code?.toLowerCase() || "";

    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      studentName.includes(query) ||
      studentEmail.includes(query) ||
      courseCode.includes(query);

    const matchesBranch = branchFilter.size === 0 || branchFilter.has(enrollment.student?.branch);
    const matchesType = typeFilter.size === 0 || typeFilter.has(enrollment.enrol_type);

    return matchesSearch && matchesBranch && matchesType;
  });

  const clearAllFilters = () => {
    setBranchFilter(new Set());
    setTypeFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return branchFilter.size > 0 || typeFilter.size > 0 || searchQuery;
  };

  // If studentId param exists, show detail page
  if (studentId) {
    const enrollment = enrollments.find(
      e => e.enrollment_id === parseInt(studentId)
    );
    // If not found in list (e.g. direct load), it might error or show not found. 
    // Ideally we should fetch specific enrollment if not found, but given structure, it assumes list loaded.
    // However, if we refresh on details page, enrollments is empty initially -> loading -> fetch -> render.
    // So we should handle that loading state or fetch specific.
    // For simplicity with current architecture, we rely on parent fetch.

    if (loading) return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching request details...</p>
      </div>
    );

    return (
      <AdvisorActionsDetailPage
        enrollment={enrollment}
        onSuccess={fetchPendingAdvisorEnrollments}
      />
    );
  }

  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">Only instructors can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
            <Users className="w-8 h-8 text-blue-600" />
            Advisor Pending Actions
          </h1>
          <p className="text-lg text-gray-600">
            Review and approve pending student enrollment requests
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
              placeholder="Search request..."
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
          <FilterDropdown
            label="Type"
            options={getUniqueValues('enrol_type')}
            selected={typeFilter}
            setSelected={setTypeFilter}
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
              {filteredEnrollments.length} request{filteredEnrollments.length !== 1 ? 's' : ''} found
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
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching pending requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Error Loading Requests</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEnrollments.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Check className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {hasActiveFilters() ? "No results match your filters." : "No pending enrollment requests awaiting approval."}
            </p>
          </div>
        )}

        {/* Students Grid */}
        {!loading && !error && filteredEnrollments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                onClick={() => navigate(`/advisor-actions/${enrollment.enrollment_id}`)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {enrollment.student?.users?.email}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Type</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{enrollment.enrol_type}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Status</p>
                      <p className="text-xs font-bold text-amber-600">Pending</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{enrollment.course?.code}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {enrollment.course?.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 pt-0 mt-auto">
                  <button className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wide shadow-md shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    Review Request
                    <ArrowRight className="w-3.5 h-3.5" />
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

// Detail Page - Individual Student Advisor Approval
function AdvisorActionsDetailPage({ enrollment, onSuccess }) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!enrollment || enrollment.enrol_status !== 'pending advisor approval') {
      toast.error('This enrollment cannot be approved');
      return;
    }

    try {
      setProcessing(true);
      const response = await axiosClient.put(
        `/enrollment/${enrollment.enrollment_id}/advisor-approval`,
        { enrol_status: 'enrolled' }
      );

      if (response.data.success) {
        toast.success('Enrollment approved successfully! Status changed to enrolled.');
        setTimeout(() => {
          navigate('/advisor-actions');
          onSuccess();
        }, 500);
      }
    } catch (err) {
      console.error('Error approving:', err);
      toast.error(err.response?.data?.message || 'Failed to approve enrollment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!enrollment || enrollment.enrol_status !== 'pending advisor approval') {
      toast.error('This enrollment cannot be rejected');
      return;
    }

    try {
      setProcessing(true);
      const response = await axiosClient.put(
        `/enrollment/${enrollment.enrollment_id}/advisor-approval`,
        { enrol_status: 'advisor rejected' }
      );

      if (response.data.success) {
        toast.success('Enrollment rejected. Status changed to advisor rejected.');
        setTimeout(() => {
          navigate('/advisor-actions');
          onSuccess();
        }, 500);
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error(err.response?.data?.message || 'Failed to reject enrollment');
    } finally {
      setProcessing(false);
    }
  };

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h2>
          <p className="text-slate-500 mb-6">The enrollment record could not be found or has already been processed.</p>
          <button
            onClick={() => navigate('/advisor-actions')}
            className="btn btn-outline btn-sm w-full"
          >
            Back to Pending Requests
          </button>
        </div>
      </div>
    );
  }

  const isPendingApproval = enrollment.enrol_status === 'pending advisor approval';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/advisor-actions')}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Back to Pending Actions
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
              <BookOpen className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4 border border-white/10 uppercase tracking-wide">
                Enrollment Approval Request
              </span>
              <h1 className="text-3xl font-black mb-1">
                {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
              </h1>
              <p className="flex items-center gap-2 text-blue-100 font-medium">
                <Mail className="w-4 h-4" />
                {enrollment.student?.users?.email}
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Degree</p>
                <p className="font-bold text-slate-800">{enrollment.student?.degree || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Batch</p>
                <p className="font-bold text-slate-800">{enrollment.student?.batch || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Branch</p>
                <p className="font-bold text-slate-800">{enrollment.student?.branch || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Requested Course
              </h3>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-lg font-black text-indigo-600 flex-shrink-0">
                  {enrollment.course?.code?.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg text-slate-900">{enrollment.course?.title}</h4>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-200">
                      {enrollment.course?.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap text-xs font-medium text-slate-500 gap-x-4 gap-y-2">
                    <span>Session: {enrollment.offering?.acad_session}</span>
                    <span>•</span>
                    <span>Slot: {enrollment.offering?.slot || 'N/A'}</span>
                    <span>•</span>
                    <span>Credits: {enrollment.course?.ltp}</span>
                    <span>•</span>
                    <span className="text-indigo-600">Type: {enrollment.enrol_type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            {isPendingApproval ? (
              <>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-6 py-3 rounded-xl font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-colors shadow-sm text-sm"
                >
                  {processing ? <span className="loading loading-spinner loading-sm"></span> : 'Reject Request'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 text-sm flex items-center gap-2"
                >
                  {processing ? <span className="loading loading-spinner loading-sm text-white"></span> : <>
                    <Check className="w-4 h-4" />
                    Approve Request
                  </>}
                </button>
              </>
            ) : (
              <div className="w-full text-center py-2 text-slate-400 font-medium text-sm">
                This request has already been processed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvisorActionsPage;
