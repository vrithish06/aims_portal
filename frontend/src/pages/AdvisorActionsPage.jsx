import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Check, X, ArrowLeft, AlertCircle } from 'lucide-react';

// Main Page - List of Courses
function AdvisorActionsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { offeringId } = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advisorInfo, setAdvisorInfo] = useState(null);

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
      let enrollments = response.data.data || [];
      setAdvisorInfo(response.data.advisorInfo);
      
      // Filter only pending advisor approval status
      enrollments = enrollments.filter(e => e.enrol_status === 'pending advisor approval');
      
      console.log('Filtered enrollments for advisor approval:', enrollments);
      
      // Group enrollments by offering and course
      const groupedByOffering = enrollments.reduce((acc, enrollment) => {
        const id = enrollment.offering_id;
        if (!acc[id]) {
          acc[id] = {
            offering_id: id,
            course: enrollment.course,
            offering: enrollment.offering,
            enrollments: []
          };
        }
        acc[id].enrollments.push(enrollment);
        return acc;
      }, {});

      setOfferings(Object.values(groupedByOffering));
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

  // If offeringId param exists, show detail page
  if (offeringId) {
    return <AdvisorActionsDetailPage />;
  }

  const handleCourseClick = (offering) => {
    navigate(`/advisor-actions/${offering.offering_id}`, { state: { offering } });
  };

  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Only instructors can view this page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Advisor Actions
          </h1>
          <p className="text-gray-600">
            Approve or reject pending student enrollment requests
          </p>
          {advisorInfo && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Degree:</span> {advisorInfo.degree} | 
                <span className="font-semibold ml-4">Batch:</span> {advisorInfo.batch}
              </p>
            </div>
          )}
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
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        )}

        {/* No Enrollments */}
        {!loading && !error && offerings.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              No pending enrollment requests waiting for your approval
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && offerings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => (
              <div
                key={offering.offering_id}
                onClick={() => handleCourseClick(offering)}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{offering.course?.title}</h3>
                      <p className="text-purple-100 text-sm">{offering.course?.code}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-gray-600 text-xs font-semibold">PENDING</p>
                        <p className="text-2xl font-bold text-purple-600">{offering.enrollments.length}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-600 text-xs font-semibold">LTP</p>
                        <p className="text-lg font-bold text-gray-800">{offering.course?.ltp}</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="text-sm text-gray-600">
                      <p><span className="font-semibold">Session:</span> {offering.offering?.acad_session}</p>
                      <p><span className="font-semibold">Section:</span> {offering.offering?.section || 'N/A'}</p>
                    </div>

                    {/* Button */}
                    <button className="w-full btn btn-sm btn-primary text-white">
                      Review Requests
                    </button>
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

// Detail Page - Enrollments for a specific course
function AdvisorActionsDetailPage() {
  const navigate = useNavigate();
  const { offeringId } = useParams();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUpdating, setActionUpdating] = useState(null);
  const [offering, setOffering] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, [offeringId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/enrollment/pending-advisor');
      let allEnrollments = response.data.data || [];
      
      // Filter only pending advisor approval status
      allEnrollments = allEnrollments.filter(e => e.enrol_status === 'pending advisor approval');
      
      // Filter for this offering
      const offeringEnrollments = allEnrollments.filter(
        e => e.offering_id === parseInt(offeringId)
      );

      if (offeringEnrollments.length > 0) {
        setOffering(offeringEnrollments[0].offering);
      }

      console.log('Enrollments for detail page:', offeringEnrollments);
      setEnrollments(offeringEnrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollmentId);
      console.log('Approving enrollment:', enrollmentId);
      const response = await axiosClient.put(
        `/enrollment/${enrollmentId}/advisor-approval`,
        { enrol_status: 'enrolled' }
      );

      if (response.data.success) {
        toast.success('Enrollment approved! Student is now enrolled.');
        setEnrollments(enrollments.filter(e => e.enrollment_id !== enrollmentId));
      } else {
        toast.error(response.data.message || 'Failed to approve');
      }
    } catch (err) {
      console.error('Error approving:', err);
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionUpdating(null);
    }
  };

  const handleReject = async (enrollmentId) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollmentId);
      console.log('Rejecting enrollment:', enrollmentId);
      const response = await axiosClient.put(
        `/enrollment/${enrollmentId}/advisor-approval`,
        { enrol_status: 'advisor rejected' }
      );

      if (response.data.success) {
        toast.success('Enrollment rejected!');
        setEnrollments(enrollments.filter(e => e.enrollment_id !== enrollmentId));
      } else {
        toast.error(response.data.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/advisor-actions')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Advisor Actions
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {loading ? (
            <div className="loading loading-spinner loading-sm"></div>
          ) : offering && enrollments.length > 0 ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {enrollments[0]?.course?.title}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-semibold">Code</p>
                  <p>{enrollments[0]?.course?.code}</p>
                </div>
                <div>
                  <p className="font-semibold">LTP</p>
                  <p>{enrollments[0]?.course?.ltp}</p>
                </div>
                <div>
                  <p className="font-semibold">Session</p>
                  <p>{offering?.acad_session}</p>
                </div>
                <div>
                  <p className="font-semibold">Section</p>
                  <p>{offering?.section || 'N/A'}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg text-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && <div className="alert alert-error mb-6"><span>{error}</span></div>}

        {/* Enrollments List */}
        {!loading && enrollments.length > 0 && (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-800">
                    {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{enrollment.student?.users?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {enrollment.enrol_type}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Degree: {enrollment.student?.degree}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className="font-semibold text-orange-600">{enrollment.enrol_status}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(enrollment.enrollment_id)}
                    disabled={actionUpdating === enrollment.enrollment_id}
                    className="btn btn-sm btn-success text-white"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(enrollment.enrollment_id)}
                    disabled={actionUpdating === enrollment.enrollment_id}
                    className="btn btn-sm btn-error text-white"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Enrollments */}
        {!loading && enrollments.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No pending enrollment requests for this course</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvisorActionsPage;
