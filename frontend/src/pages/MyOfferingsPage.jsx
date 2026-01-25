import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  GraduationCap,
  Layers,
  Briefcase,
  Search,
  X,
  ChevronDown,
  Check
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

function MyOfferingsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  // Data States
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(new Set());
  const [sessionFilter, setSessionFilter] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchMyOfferings();
  }, [isAuthenticated, user, navigate]);

  const fetchMyOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = user?.role === 'admin' ? '/offering/all-offerings' : '/offering/my-offerings';
      const response = await axiosClient.get(endpoint);
      setOfferings(response.data.data || []);
    } catch (err) {
      console.error('Error fetching offerings:', err);
      setError(err.response?.data?.message || 'Failed to load offerings');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (offering) => {
    navigate(`/course/${offering.offering_id}`, { state: { offering } });
  };

  const handleOfferingStatusChange = async (offeringId, newStatus) => {
    if (statusUpdating) return;

    try {
      setStatusUpdating(offeringId);
      const response = await axiosClient.put(`/offering/${offeringId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`Offering ${newStatus === 'Accepted' ? 'accepted' : 'rejected'} successfully!`);
        setOfferings(offerings.map(off =>
          off.offering_id === offeringId
            ? { ...off, status: newStatus === 'Accepted' ? 'Enrolling' : 'Rejected' }
            : off
        ));
      } else {
        toast.error(response.data.message || 'Failed to update offering status');
      }
    } catch (err) {
      console.error('Error updating offering status:', err);
      toast.error(err.response?.data?.message || 'Failed to update offering status');
    } finally {
      setStatusUpdating(null);
    }
  };

  // --- Filter Logic ---

  const getUniqueValues = (key) => {
    return [...new Set(offerings.map(o => o[key]).filter(Boolean))].sort();
  };

  const filteredOfferings = offerings.filter(offering => {
    const course = offering.course;
    const matchesSearch = !searchQuery ||
      (course?.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course?.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter.size === 0 || statusFilter.has(offering.status);
    const matchesDepartment = departmentFilter.size === 0 || departmentFilter.has(offering.dept_name);
    const matchesSession = sessionFilter.size === 0 || sessionFilter.has(offering.acad_session);

    return matchesSearch && matchesStatus && matchesDepartment && matchesSession;
  });

  const clearAllFilters = () => {
    setStatusFilter(new Set());
    setDepartmentFilter(new Set());
    setSessionFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return statusFilter.size > 0 || departmentFilter.size > 0 || sessionFilter.size > 0 || searchQuery;
  };

  if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <BookOpen className="w-8 h-8 text-blue-600" />
          {user?.role === 'admin' ? 'Manage All Offerings' : 'My Course Offerings'}
        </h1>
        <p className="text-lg text-gray-600">
          Total courses managed: {offerings.length}
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
            options={getUniqueValues('status')}
            selected={statusFilter}
            setSelected={setStatusFilter}
          />
          <FilterDropdown
            label="Department"
            options={getUniqueValues('dept_name')}
            selected={departmentFilter}
            setSelected={setDepartmentFilter}
          />
          <FilterDropdown
            label="Session"
            options={getUniqueValues('acad_session')}
            selected={sessionFilter}
            setSelected={setSessionFilter}
          />

          <div className="w-14 ml-2 flex justify-center">
            <button
              onClick={clearAllFilters}
              className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${statusFilter.size > 0 || departmentFilter.size > 0 || sessionFilter.size > 0 || searchQuery
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
      <div className="p-6 max-w-[1600px] mx-auto">
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl">
            <span className="text-blue-800 font-medium text-sm">
              {filteredOfferings.length} course{filteredOfferings.length !== 1 ? 's' : ''} found
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
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>{error}</span>
          </div>
        )}

        {/* No Offerings */}
        {!loading && !error && filteredOfferings.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-2 text-sm">
              {hasActiveFilters() ? "Try adjusting your filters or search." : "You haven't offered any courses yet."}
            </p>
          </div>
        )}

        {/* Grid Layout */}
        {!loading && filteredOfferings.length > 0 && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOfferings.map((offering) => {
              // Status Styling Helper
              const getStatusStyle = (status) => {
                switch (status?.toLowerCase()) {
                  case 'running': case 'accepted': case 'enrolling': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  case 'proposed': return 'bg-amber-50 text-amber-700 border-amber-200';
                  case 'cancelled': case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
                  default: return 'bg-blue-50 text-blue-700 border-blue-200';
                }
              };

              const enrollmentCount = offering._count?.enrollments || 0;

              return (
                <div
                  key={offering.offering_id}
                  onClick={() => handleCourseClick(offering)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
                >
                  {/* CARD HEADER */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mb-2">
                          {offering.course?.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {offering.course?.title || 'Untitled Course'}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex-shrink-0 ${getStatusStyle(offering.status)}`}>
                        {offering.status || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-5 flex-1 space-y-4">

                    {/* Row 1: Degree & Department */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[120px]" title={offering.degree}>
                          {offering.degree || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[80px]" title={offering.dept_name || 'N/A'}>{offering.dept_name || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Row 2: Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Slot */}
                      <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center border border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Slot</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{offering.slot || '-'}</span>
                      </div>

                      {/* Section */}
                      <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center border border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Layers className="w-3 h-3 text-purple-500" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Sec</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{offering.section || '-'}</span>
                      </div>

                      {/* Enrolled */}
                      <div className="bg-blue-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center border border-blue-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wide">Total</span>
                        </div>
                        <span className="text-xs font-bold text-blue-700">{enrollmentCount}</span>
                      </div>
                    </div>

                    {/* Row 3: Session */}
                    <div className="flex items-center justify-between pt-3 text-[11px] font-medium text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        <span>{offering.acad_session}</span>
                      </div>
                      <span className="text-slate-300 font-mono text-[10px]">#{offering.offering_id}</span>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="p-4 pt-0 mt-auto space-y-3" onClick={(e) => e.stopPropagation()}>

                    {/* Admin Actions for Proposed Courses */}
                    {offering.status === 'Proposed' && user?.role === 'admin' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOfferingStatusChange(offering.offering_id, 'Accepted');
                          }}
                          disabled={statusUpdating === offering.offering_id}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-xs font-bold shadow-sm shadow-emerald-200"
                        >
                          {statusUpdating === offering.offering_id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOfferingStatusChange(offering.offering_id, 'Rejected');
                          }}
                          disabled={statusUpdating === offering.offering_id}
                          className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-xs font-bold shadow-sm shadow-rose-200"
                        >
                          {statusUpdating === offering.offering_id ? '...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCourseClick(offering)}
                        className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-xs shadow-md shadow-blue-200 uppercase tracking-wide"
                      >
                        Manage & View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOfferingsPage;