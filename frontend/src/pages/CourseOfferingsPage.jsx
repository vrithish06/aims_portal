import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Zap,
  ChevronDown,
  Search,
  X,
  ListFilter,
  User,
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  AlertCircle
} from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [coordinators, setCoordinators] = useState({});
  const [slashWarning, setSlashWarning] = useState({ show: false, offering: null, enrollType: null });

  // Filter States
  const [tempFilters, setTempFilters] = useState({
    department: [],
    slot: [],
    session: [],
    status: []
  });
  const [filters, setFilters] = useState({
    department: [],
    slot: [],
    session: [],
    status: []
  });

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

  // Filter Logic
  const getUniqueValues = (key) => {
    return [...new Set(offerings.map(o => o[key]).filter(Boolean))].sort();
  };

  const filteredOfferings = offerings.filter(offering => {
    const course = offering.course;
    const matchesSearch = !searchQuery ||
      (course?.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course?.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilters =
      (filters.department.length === 0 || filters.department.includes(offering.dept_name)) &&
      (filters.slot.length === 0 || filters.slot.includes(offering.slot)) &&
      (filters.session.length === 0 || filters.session.includes(offering.acad_session)) &&
      (filters.status.length === 0 || filters.status.includes(offering.status));

    return matchesSearch && matchesFilters;
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

  const clearAllFilters = () => {
    const emptyFilters = {
      department: [],
      slot: [],
      session: [],
      status: []
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(f => f.length > 0) || searchQuery;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <Zap className="w-8 h-8 text-blue-600" />
          Offered Courses
        </h1>
        <p className="text-lg text-gray-600">
          Total offerings: {offerings.length}
        </p>
      </div>

      {/* Search Bar with Filter Button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors flex-shrink-0 ${showFilters
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
              placeholder="Search by course code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex gap-4">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {Object.values(tempFilters).some(f => f.length > 0) && (
                  <button
                    onClick={() => setTempFilters({ department: [], slot: [], session: [], status: [] })}
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

              {/* Department Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Department</h4>
                <div className="space-y-2">
                  {getUniqueValues('dept_name').map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.department.includes(dept)}
                        onChange={() => toggleTempFilter('department', dept)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Slot Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Slot</h4>
                <div className="space-y-2">
                  {getUniqueValues('slot').map(slot => (
                    <label key={slot} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.slot.includes(slot)}
                        onChange={() => toggleTempFilter('slot', slot)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{slot}</span>
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

        {/* Courses Grid */}
        <div className="flex-1">
          {hasActiveFilters() && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
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
            </div>
          )}

          {filteredOfferings.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
              <span>No courses match your search or filters.</span>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {filteredOfferings.map((offering) => {
                const course = offering.course;
                const coordinatorName = coordinators[offering.offering_id] || 'TBA';
                const enrollmentCount = enrollmentStats[offering.offering_id] || 0;

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

                return (
                  <div
                    key={offering.offering_id}
                    onClick={() => handleCourseClick(offering)}
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col relative"
                  >
                    {/* CARD HEADER */}
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2">
                            {course?.code}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {course?.title || 'Untitled Course'}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap ${getStatusStyle(offering.status)}`}>
                          {(offering.status === 'Canceled' || offering.status === 'Cancelled') ? 'Declined' : (offering.status || 'Unknown')}
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 flex-1 space-y-4">

                      {/* Row 1: Instructor & Dept */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>
                            {coordinatorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{offering.dept_name}</span>
                        </div>
                      </div>

                      {/* Row 2: Grid for Slot & Credits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Slot</span>
                            {(() => {
                              const isClashing = enrolledCourses.some(
                                c => c.course_offering?.slot === offering.slot &&
                                  c.course_offering?.acad_session === offering.acad_session
                              );
                              return (
                                <span className={`text-sm font-bold ${isClashing ? 'text-red-600' : 'text-green-600'}`}>
                                  {offering.slot}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Credits</span>
                            <span className="text-sm font-bold text-gray-700">{course?.ltp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Session & Enrollment */}
                      <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{offering.acad_session}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{enrollmentCount} Enrolled (Sec {offering.section || 'A'})</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER - Actions */}
                    <div className="p-4 pt-0 mt-auto" onClick={(e) => e.stopPropagation()}>

                      {/* ADMIN: Accept/Reject */}
                      {user?.role === 'admin' && offering.status === 'Proposed' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOfferingStatusChange(offering.offering_id, 'Accepted')}
                            disabled={statusUpdating === offering.offering_id}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm"
                          >
                            {statusUpdating === offering.offering_id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleOfferingStatusChange(offering.offering_id, 'Rejected')}
                            disabled={statusUpdating === offering.offering_id}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm"
                          >
                            {statusUpdating === offering.offering_id ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : user?.role === 'student' ? (
                        /* STUDENT: Enroll Logic */
                        (() => {
                          const enrolled = enrolledCourses.find(e => e.course_offering?.offering_id === offering.offering_id);

                          if (offering.status === 'Cancelled') {
                            return (
                              <div className="w-full py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200 text-center">
                                Enrollment Cancelled
                              </div>
                            );
                          }

                          if (enrolled) {
                            return (
                              <div className="w-full py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200 text-center flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Enrolled as {enrolled.enrol_type}
                              </div>
                            );
                          }

                          if (offering.status !== 'Enrolling') {
                            return (
                              <button
                                onClick={() => handleCourseClick(offering)}
                                className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
                                    <ChevronDown className="w-4 h-4 ml-auto" />
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