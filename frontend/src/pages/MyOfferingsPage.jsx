import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import { ChevronDown, Users, BookOpen, Clock } from 'lucide-react';

function MyOfferingsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOffering, setExpandedOffering] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchMyOfferings();
  }, [isAuthenticated, user, navigate]);

  const fetchMyOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/offering/my-offerings');
      setOfferings(response.data.data || []);
    } catch (err) {
      console.error('Error fetching offerings:', err);
      setError(err.response?.data?.message || 'Failed to load offerings');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>You must be logged in to view this page</span>
        </div>
      </div>
    );
  }

  if (user?.role !== 'instructor') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Only instructors can view their offerings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Course Offerings</h1>
          <p className="text-gray-600">Manage and view your offered courses</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* No Offerings */}
        {!loading && offerings.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">You haven't offered any courses yet</p>
          </div>
        )}

        {/* Offerings Grid */}
        {!loading && offerings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => (
              <div
                key={offering.offering_id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{offering.course?.title}</h3>
                  <p className="text-blue-100 text-sm">{offering.course?.code}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Basic Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-primary">{offering.acad_session}</span>
                      <span className="badge badge-outline">{offering.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Degree</p>
                        <p className="text-gray-800">{offering.degree || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Department</p>
                        <p className="text-gray-800">{offering.dept_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Section</p>
                        <p className="text-gray-800">{offering.section || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Slot</p>
                        <p className="text-gray-800">{offering.slot || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Stats */}
                  <button
                    onClick={() =>
                      setExpandedOffering(
                        expandedOffering === offering.offering_id ? null : offering.offering_id
                      )
                    }
                    className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded transition text-gray-700 font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {offering._count?.enrollments || 0} Enrolled Student
                        {(offering._count?.enrollments || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedOffering === offering.offering_id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {expandedOffering === offering.offering_id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Total Enrollments:</span>{' '}
                          {offering._count?.enrollments || 0}
                        </p>
                        <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min(((offering._count?.enrollments || 0) / 50) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {offering._count?.enrollments || 0} out of ~50 max capacity
                        </p>
                      </div>

                      {offering.enrollments && offering.enrollments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Enrollment Types:</p>
                          <div className="space-y-1 text-xs">
                            {Object.entries(
                              (offering.enrollments || []).reduce((acc, e) => {
                                acc[e.enrol_type] = (acc[e.enrol_type] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([type, count]) => (
                              <div key={type} className="flex justify-between text-gray-600">
                                <span>{type}</span>
                                <span className="font-medium text-blue-600">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOfferingsPage;
