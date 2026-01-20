import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Zap, ChevronDown, Search, X, ListFilter } from 'lucide-react';

function CourseOfferingsPage() {
  const [offerings, setOfferings] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStats, setEnrollmentStats] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedEnrollType, setSelectedEnrollType] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/course-offerings');
      
      if (response.data.success) {
        setOfferings(response.data.data);
        response.data.data.forEach(offering => {
          fetchEnrollmentStats(offering.offering_id);
        });
      }
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

  const handleEnroll = async (offeringId, enrollType = 'Credit') => {
    if (!user?.user_id) {
      toast.error('Please login first');
      return;
    }

    try {
      setEnrolling(offeringId);
      const response = await axiosClient.post(
        `/offering/${offeringId}/enroll`,
        {
          enrol_type: enrollType,
          enrol_status: 'enrolled'
        }
      );

      if (response.data.success) {
        toast.success(`Successfully enrolled as ${enrollType}!`);
        
        setTimeout(async () => {
          await fetchEnrollmentStats(offeringId);
          await fetchCourseOfferings();
          setOpenDropdown(null);
        }, 300);
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

  // Get unique filter options
  const getUniqueValues = (key) => {
    return [...new Set(offerings.map(o => o[key]).filter(Boolean))].sort();
  };

  // Filter offerings based on search and filters
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

  const handleFilterKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
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
        {/* Filters Sidebar - Conditional Rendering */}
        {showFilters && (
          <div className="w-80 flex-shrink-0" onKeyPress={handleFilterKeyPress}>
            <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {Object.values(tempFilters).some(f => f.length > 0) && (
                  <button
                    onClick={() => setTempFilters({
                      department: [],
                      slot: [],
                      session: [],
                      status: []
                    })}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
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

              {/* Session Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Session</h4>
                <div className="space-y-2">
                  {getUniqueValues('acad_session').map(session => (
                    <label key={session} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.session.includes(session)}
                        onChange={() => toggleTempFilter('session', session)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{session}</span>
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

              {/* Apply Filters Button */}
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
          {/* Active Filters Display */}
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
                const instructor = offering.instructor?.users;
                const enrollmentCount = enrollmentStats[offering.offering_id] || 0;
                
                return (
                  <div 
                    key={offering.offering_id}
                    onClick={() => handleCourseClick(offering)}
                    className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:shadow-xl transition-all hover:border-blue-400"
                  >
                    {/* Course Code - Link Style */}
                    <div className="mb-4">
                      <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCourseClick(offering); }} className="text-2xl text-blue-700 hover:text-blue-900 hover:underline font-bold">
                        {course?.code}
                      </a>
                      {course?.title && (
                        <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCourseClick(offering); }} className="text-lg text-blue-600 hover:text-blue-800 hover:underline font-semibold block mt-1">
                          {course?.title}
                        </a>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="space-y-2 text-sm mb-6">
                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">CREDITS</span> <span className="text-gray-700 font-medium">{course?.ltp || 'N/A'}</span>. 
                        <span className="font-bold text-gray-900 ml-2">STATUS</span> 
                        <span className={`ml-1 font-bold ${
                          offering.status === 'open' ? 'text-green-600 bg-green-100 px-2 py-0.5 rounded' : 
                          offering.status === 'closed' ? 'text-red-600 bg-red-100 px-2 py-0.5 rounded' : 
                          offering.status === 'ongoing' ? 'text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded' : 
                          'text-blue-600 bg-blue-100 px-2 py-0.5 rounded'
                        }`}>
                          {offering.status?.charAt(0).toUpperCase() + offering.status?.slice(1) || 'Unknown'}
                        </span>
                        . <span className="font-bold text-gray-900 ml-2">SESSION</span> <span className="text-gray-700 font-medium">{offering.acad_session || 'N/A'}</span>.
                      </p>

                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">ENROLLMENT</span> <span className="text-gray-700 font-medium">{enrollmentCount} in Sec.-{offering.section || 'A'}</span>.
                      </p>

                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">OFFERED BY</span> <span className="text-gray-700 font-medium">{offering.dept_name || 'N/A'}</span>.
                      </p>

                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">SLOT</span> <span className="text-gray-700 font-medium">{offering.slot || 'N/A'}</span>.
                      </p>

                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">INSTRUCTOR(S)</span> <span className="text-gray-700 font-medium">{instructor ? `${instructor.first_name} ${instructor.last_name}` : 'N/A'}</span>.
                      </p>
                    </div>

                    {/* Enroll Button with Dropdown */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === offering.offering_id ? null : offering.offering_id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
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
                        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-300 rounded shadow-lg z-50">
                          <button
                            onClick={() => {
                              handleEnroll(offering.offering_id, 'Credit');
                              setOpenDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                          >
                            Credit
                          </button>
                          <button
                            onClick={() => {
                              handleEnroll(offering.offering_id, 'Credit for Minor');
                              setOpenDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-t border-gray-200"
                          >
                            Credit for Minor
                          </button>
                          <button
                            onClick={() => {
                              handleEnroll(offering.offering_id, 'Credit for Concentration');
                              setOpenDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-t border-gray-200"
                          >
                            Credit for Concentration
                          </button>
                          <button
                            onClick={() => {
                              handleEnroll(offering.offering_id, 'Credit for Audit');
                              setOpenDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-t border-gray-200"
                          >
                            Credit for Audit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseOfferingsPage;
