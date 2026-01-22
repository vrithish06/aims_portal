import React, { useEffect, useState } from 'react';
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
  ListFilter
} from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    status: [],
    department: [],
    session: []
  });
  const [filters, setFilters] = useState({
    status: [],
    department: [],
    session: []
  });

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

    const matchesFilters = 
      (filters.status.length === 0 || filters.status.includes(offering.status)) &&
      (filters.department.length === 0 || filters.department.includes(offering.dept_name)) &&
      (filters.session.length === 0 || filters.session.includes(offering.acad_session));

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

  const toggleFilters = () => {
    if (showFilters) {
      setShowFilters(false);
    } else {
      setTempFilters(filters);
      setShowFilters(true);
    }
  };

  const clearAllFilters = () => {
    const emptyFilters = { status: [], department: [], session: [] };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(f => f.length > 0) || searchQuery;
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
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0" onKeyPress={(e) => e.key === 'Enter' && applyFilters()}>
            <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {Object.values(tempFilters).some(f => f.length > 0) && (
                  <button
                    onClick={() => setTempFilters({ status: [], department: [], session: [] })}
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

              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Offerings Grid */}
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

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* No Offerings */}
          {!loading && !error && filteredOfferings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No courses found</h3>
              <p className="text-gray-500 mt-2">
                {hasActiveFilters() ? "Try adjusting your filters or search." : "You haven't offered any courses yet."}
              </p>
            </div>
          )}

          {/* Grid Layout */}
          {!loading && filteredOfferings.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {filteredOfferings.map((offering) => {
                // Status Styling Helper
                const getStatusStyle = (status) => {
                  switch(status?.toLowerCase()) {
                    case 'running': case 'accepted': case 'enrolling': return 'bg-green-100 text-green-700 border-green-200';
                    case 'proposed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                    case 'cancelled': case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
                    default: return 'bg-blue-100 text-blue-700 border-blue-200';
                  }
                };

                const enrollmentCount = offering._count?.enrollments || 0;

                return (
                  <div
                    key={offering.offering_id}
                    onClick={() => handleCourseClick(offering)}
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
                  >
                    {/* CARD HEADER */}
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2">
                            {offering.course?.code}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {offering.course?.title || 'Untitled Course'}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap ${getStatusStyle(offering.status)}`}>
                          {offering.status || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 flex-1 space-y-4">
                      
                      {/* Row 1: Degree & Department */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[120px]" title={offering.degree}>
                            {offering.degree || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{offering.dept_name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Row 2: Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Slot */}
                        <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Slot</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{offering.slot || '-'}</span>
                        </div>

                        {/* Section */}
                        <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Layers className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Sec</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{offering.section || '-'}</span>
                        </div>

                        {/* Enrolled */}
                        <div className="bg-blue-50 rounded-lg p-2 flex flex-col items-center justify-center text-center border border-blue-100">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] text-blue-600 font-bold uppercase">Total</span>
                          </div>
                          <span className="text-sm font-bold text-blue-700">{enrollmentCount}</span>
                        </div>
                      </div>

                      {/* Row 3: Session */}
                      <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{offering.acad_session}</span>
                        </div>
                        <span className="text-gray-400">ID: {offering.offering_id}</span>
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
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm"
                          >
                            {statusUpdating === offering.offering_id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOfferingStatusChange(offering.offering_id, 'Rejected');
                            }}
                            disabled={statusUpdating === offering.offering_id}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm"
                          >
                            {statusUpdating === offering.offering_id ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCourseClick(offering)}
                          className="w-full bg-gray-900 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm shadow-sm"
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
    </div>
  );
}

export default MyOfferingsPage;