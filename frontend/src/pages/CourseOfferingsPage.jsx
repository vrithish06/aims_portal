import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  Search,
  X,
  User,
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  AlertCircle,
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

function CourseOfferingsPage() {
  const [offerings, setOfferings] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStats, setEnrollmentStats] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedEnrollType, setSelectedEnrollType] = useState({});
  const [allowedTypesByOffering, setAllowedTypesByOffering] = useState({});
  const [allowedTypesLoading, setAllowedTypesLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [coordinators, setCoordinators] = useState({});
  const [slashWarning, setSlashWarning] = useState({ show: false, offering: null, enrollType: null });

  // Filter States (Set based)
  const [departmentFilter, setDepartmentFilter] = useState(new Set());
  const [slotFilter, setSlotFilter] = useState(new Set());
  const [sessionFilter, setSessionFilter] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(new Set());

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseOfferings();
    fetchCoordinators();
    if (user?.role === 'student') {
      fetchEnrolledCourses();
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.enroll-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const fetchCoordinators = async () => {
    try {
      const response = await axiosClient.get('/course/offering/instructors');
      if (response.data.success) {
        const coordinatorMap = {};
        Object.keys(response.data.data).forEach(offeringId => {
          const coordinatorInfo = response.data.data[offeringId].coordinator;
          if (coordinatorInfo) {
            coordinatorMap[offeringId] = coordinatorInfo.name;
          }
        });
        setCoordinators(coordinatorMap);
      }
    } catch (error) {
      console.error('Failed to fetch coordinators:', error);
    }
  };

  const fetchCourseOfferings = async () => {
    try {
      setLoading(true);

      const response = await axiosClient.get('/course-offerings');
      if (!response.data.success) return;

      const offerings = response.data.data;
      setOfferings(offerings);

      // Fetch enrollment stats in parallel
      await Promise.all(
        offerings.map(o => fetchEnrollmentStats(o.offering_id))
      );

    } catch (error) {
      toast.error('Failed to load course offerings');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchEnrollmentStats = async (offeringId) => {
    try {
      const response = await axiosClient.get(
        `/offering/${offeringId}/enrollments`
      );

      if (response.data.success) {
        setEnrollmentStats(prev => ({
          ...prev,
          [offeringId]: response.data.count
        }));
      }
    } catch (error) {
      console.error('Failed to fetch enrollment stats:', error);
      setEnrollmentStats(prev => ({
        ...prev,
        [offeringId]: 0
      }));
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axiosClient.get('/student/enrolled-courses');
      if (response.data.success) {
        setEnrolledCourses(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    }
  };

  const checkSlotClash = (offering) => {
    return enrolledCourses.some(
      c => c.course_offering?.slot === offering.slot &&
        c.course_offering?.acad_session === offering.acad_session
    );
  };

  const ensureAllowedTypes = async (offeringId) => {
    if (allowedTypesByOffering[offeringId]) return;
    if (allowedTypesLoading === offeringId) return;
    try {
      setAllowedTypesLoading(offeringId);
      const res = await axiosClient.get(`/offering/${offeringId}/allowed-enrol-types`);
      if (res.data?.success) {
        setAllowedTypesByOffering(prev => ({
          ...prev,
          [offeringId]: res.data.data || []
        }));
      } else {
        setAllowedTypesByOffering(prev => ({ ...prev, [offeringId]: [] }));
      }
    } catch (err) {
      console.error('Failed to fetch allowed enrol types:', err);
      setAllowedTypesByOffering(prev => ({ ...prev, [offeringId]: [] }));
    } finally {
      setAllowedTypesLoading(null);
    }
  };

  const handleEnroll = async (offeringId, enrollType = 'Credit') => {
    if (!user?.user_id) {
      toast.error('Please login first');
      return;
    }

    const offering = offerings.find(o => o.offering_id === offeringId);

    // Check for slot clash
    if (checkSlotClash(offering)) {
      setSlashWarning({ show: true, offering, enrollType });
      setOpenDropdown(null);
      return;
    }

    // Proceed with enrollment
    await proceedWithEnrollment(offeringId, enrollType);
  };

  const proceedWithEnrollment = async (offeringId, enrollType = 'Credit') => {
    try {
      setEnrolling(offeringId);
      const response = await axiosClient.post(
        `/offering/${offeringId}/enroll`,
        {
          enrol_type: enrollType,
          enrol_status: 'pending instructor approval'
        }
      );

      if (response.data.success) {
        toast.success(`Successfully enrolled as ${enrollType}!`);

        // Refresh data
        await fetchEnrollmentStats(offeringId);
        await fetchEnrolledCourses(); // Update enrollment status immediately
        setOpenDropdown(null);
      } else {
        toast.error('Enrollment failed');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You are already enrolled in this course');
      } else {
        toast.error(error.response?.data?.message || 'Failed to enroll');
      }
      console.error('Enrollment error:', error);
    } finally {
      setEnrolling(null);
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
            ? { ...off, status: newStatus === 'Accepted' ? 'Enrolling' : 'Declined' }
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

  // Status Color Logic
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': case 'enrolling': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': case 'cancelled': case 'canceled': case 'rejected': case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      case 'ongoing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'proposed': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Filter Logic Helpers
  const getUniqueValues = (key) => {
    return [...new Set(offerings.map(o => o[key]).filter(Boolean))].sort();
  };

  const filteredOfferings = offerings.filter(offering => {
    const course = offering.course;
    const matchesSearch = !searchQuery ||
      (course?.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course?.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDepartment = departmentFilter.size === 0 || departmentFilter.has(offering.dept_name);
    const matchesSlot = slotFilter.size === 0 || slotFilter.has(offering.slot);
    const matchesSession = sessionFilter.size === 0 || sessionFilter.has(offering.acad_session);
    const matchesStatus = statusFilter.size === 0 || statusFilter.has(offering.status);

    return matchesSearch && matchesDepartment && matchesSlot && matchesSession && matchesStatus;
  });

  const clearAllFilters = () => {
    setDepartmentFilter(new Set());
    setSlotFilter(new Set());
    setSessionFilter(new Set());
    setStatusFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return departmentFilter.size > 0 ||
      slotFilter.size > 0 ||
      sessionFilter.size > 0 ||
      statusFilter.size > 0 ||
      searchQuery !== '';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching course offerings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            label="Department"
            options={getUniqueValues('dept_name')}
            selected={departmentFilter}
            setSelected={setDepartmentFilter}
          />

          <FilterDropdown
            label="Slot"
            options={getUniqueValues('slot')}
            selected={slotFilter}
            setSelected={setSlotFilter}
          />

          <FilterDropdown
            label="Session"
            options={getUniqueValues('acad_session')}
            selected={sessionFilter}
            setSelected={setSessionFilter}
          />

          <FilterDropdown
            label="Status"
            options={getUniqueValues('status')}
            selected={statusFilter}
            setSelected={setStatusFilter}
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

      {/* Main Content */}
      <div className="py-8 px-4 w-full">
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl max-w-full">
            <span className="text-blue-800 font-medium text-sm">
              {filteredOfferings.length} course{filteredOfferings.length !== 1 ? 's' : ''} found
            </span>
          </div>
        )}

        {filteredOfferings.length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 px-6 py-12 rounded-xl text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <span className="text-lg font-medium">No courses match your search or filters.</span>
            <button
              onClick={clearAllFilters}
              className="block mx-auto mt-2 text-blue-600 hover:underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOfferings.map((offering) => {
              const course = offering.course;
              const coordinatorName = coordinators[offering.offering_id] || 'TBA';
              const enrollmentCount = enrollmentStats[offering.offering_id] || 0;

              // Status Color Logic
              const getStatusStyle = (status) => {
                switch (status?.toLowerCase()) {
                  case 'open': case 'enrolling': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  case 'closed': case 'cancelled': case 'canceled': case 'rejected': case 'declined': return 'bg-rose-50 text-rose-700 border-rose-200';
                  case 'ongoing': return 'bg-amber-50 text-amber-700 border-amber-200';
                  case 'proposed': return 'bg-purple-50 text-purple-700 border-purple-200';
                  default: return 'bg-slate-50 text-slate-700 border-slate-200';
                }
              };

              return (
                <div
                  key={offering.offering_id}
                  onClick={() => handleCourseClick(offering)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* CARD HEADER */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/30 rounded-t-2xl">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mb-2">
                          {course?.code}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {course?.title || 'Untitled Course'}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide flex-shrink-0 ${getStatusStyle(offering.status)}`}>
                        {(offering.status === 'Canceled' || offering.status === 'Cancelled') ? 'Declined' : (offering.status || 'Unknown')}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-6 flex-1 space-y-5">
                    {/* Instructor & Dept */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[120px]" title={coordinatorName}>
                          {coordinatorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[80px]" title={offering.dept_name}>{offering.dept_name}</span>
                      </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-2.5 border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">Slot</span>
                          {(() => {
                            const isClashing = enrolledCourses.some(
                              c => c.course_offering?.slot === offering.slot &&
                                c.course_offering?.acad_session === offering.acad_session
                            );
                            return (
                              <span className={`text-xs font-bold leading-none ${isClashing ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {offering.slot}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-2.5 border border-slate-100">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">Credits</span>
                          <span className="text-xs font-bold text-slate-700 leading-none">{course?.ltp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between pt-3 text-[11px] font-medium text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        <span>{offering.acad_session}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span>{enrollmentCount} Enrolled</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD FOOTER - Actions */}
                  <div className="p-4 pt-0 mt-auto" onClick={(e) => e.stopPropagation()}>
                    {user?.role === 'admin' && offering.status === 'Proposed' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOfferingStatusChange(offering.offering_id, 'Accepted')}
                          disabled={statusUpdating === offering.offering_id}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-xs font-bold shadow-sm shadow-emerald-200"
                        >
                          {statusUpdating === offering.offering_id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleOfferingStatusChange(offering.offering_id, 'Rejected')}
                          disabled={statusUpdating === offering.offering_id}
                          className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-xs font-bold shadow-sm shadow-rose-200"
                        >
                          {statusUpdating === offering.offering_id ? '...' : 'Reject'}
                        </button>
                      </div>
                    ) : user?.role === 'student' ? (
                      (() => {
                        const enrolled = enrolledCourses.find(e => e.course_offering?.offering_id === offering.offering_id);

                        if (offering.status === 'Cancelled') {
                          return (
                            <div className="w-full py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100 text-center uppercase tracking-wide">
                              Enrollment Cancelled
                            </div>
                          );
                        }

                        if (enrolled) {
                          const status = enrolled.enrol_status;
                          const getEnrolledStatusStyle = (s) => {
                            switch (s?.toLowerCase()) {
                              case 'enrolled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              case 'pending instructor approval': return 'bg-amber-50 text-amber-700 border-amber-200';
                              case 'pending advisor approval': return 'bg-orange-50 text-orange-700 border-orange-200';
                              case 'rejected': case 'instructor rejected': case 'advisor rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
                              default: return 'bg-blue-50 text-blue-700 border-blue-200';
                            }
                          };

                          return (
                            <div className={`w-full py-2.5 rounded-xl text-[10px] font-bold border text-center flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm ${getEnrolledStatusStyle(status)}`}>
                              {status === 'enrolled' && <Check className="w-3 h-3" />}
                              {status || 'Enrolled'}
                            </div>
                          );
                        }

                        if (offering.status !== 'Enrolling') {
                          return (
                            <button
                              onClick={() => handleCourseClick(offering)}
                              className="w-full bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-wide"
                            >
                              View Details
                            </button>
                          );
                        }

                        return (
                          <div className="relative enroll-dropdown-container">
                            <button
                              onClick={async () => {
                                const next = openDropdown === offering.offering_id ? null : offering.offering_id;
                                setOpenDropdown(next);
                                if (next) await ensureAllowedTypes(offering.offering_id);
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-sm shadow-blue-200 active:transform active:scale-95 text-sm"
                              disabled={enrolling === offering.offering_id}
                            >
                              {enrolling === offering.offering_id ? (
                                <>
                                  <span className="loading loading-spinner loading-xs"></span>
                                  Enrolling...
                                </>
                              ) : (
                                <>
                                  {selectedEnrollType[offering.offering_id] ? selectedEnrollType[offering.offering_id] : 'Enroll'}
                                  <ChevronDown className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            {openDropdown === offering.offering_id && (
                              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {allowedTypesLoading === offering.offering_id ? (
                                  <div className="px-4 py-3 text-sm text-gray-600">
                                    <span className="loading loading-spinner loading-xs mr-2"></span>
                                    Loading options...
                                  </div>
                                ) : (
                                  (allowedTypesByOffering[offering.offering_id] || []).map((type) => (
                                    <button
                                      key={type}
                                      onClick={() => handleEnroll(offering.offering_id, type)}
                                      className="block w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-sm font-medium border-b border-gray-100 last:border-0 transition-colors"
                                    >
                                      {type}
                                    </button>
                                  ))
                                )}

                                {allowedTypesLoading !== offering.offering_id &&
                                  (allowedTypesByOffering[offering.offering_id] || []).length === 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-600">
                                      No enrollment types available for you.
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      /* GUEST/INSTRUCTOR: View Details */
                      <button
                        onClick={() => handleCourseClick(offering)}
                        className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-200"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slot Clash Warning Modal */}
      {slashWarning.show && slashWarning.offering && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Timetable Clash Warning</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are already enrolled in a course with slot <span className="font-bold text-red-600">{slashWarning.offering.slot}</span> in session <span className="font-bold">{slashWarning.offering.acad_session}</span>.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Enrolling in this course will create a timetable clash. Do you want to continue?
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSlashWarning({ show: false, offering: null, enrollType: null })}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSlashWarning({ show: false, offering: null, enrollType: null });
                  proceedWithEnrollment(slashWarning.offering.offering_id, slashWarning.enrollType);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseOfferingsPage;