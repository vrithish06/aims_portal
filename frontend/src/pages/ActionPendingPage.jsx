import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { ChevronDown, BookOpen, Clock, Check, X, ArrowLeft, Users, ArrowRight } from 'lucide-react';

// Main Page - List of Courses
function ActionPendingPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { offeringId } = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchPendingEnrollments();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/enrollment/pending-instructor');
      const enrollments = response.data.data || [];
      
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
      console.error('Error fetching pending enrollments:', err);
      setError(err.response?.data?.message || 'Failed to load pending enrollments');
    } finally {
      setLoading(false);
    }
  };

  // If offeringId param exists, show detail page
  if (offeringId) {
    return <ActionPendingDetailPage />;
  }

  // Filter enrollments - show all pending requests regardless of status
  const filteredOfferings = offerings.map(off => ({
    ...off,
    enrollments: off.enrollments
  })).filter(off => off.enrollments.length > 0);

  const handleCourseClick = (offering) => {
    navigate(`/action-pending/${offering.offering_id}`, { state: { offering } });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Pending Actions
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-16">
            Review and approve student enrollment requests
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="loading loading-spinner loading-lg text-blue-400"></div>
              <p className="text-gray-400">Loading enrollment requests...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* No Enrollments - Empty State */}
        {!loading && filteredOfferings.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center backdrop-blur">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-700/50 rounded-full">
                <Clock className="w-12 h-12 text-gray-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Pending Requests</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              You're all caught up! There are no pending student enrollment requests waiting for your action right now.
            </p>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => navigate('/my-offerings')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Back to My Offerings
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && filteredOfferings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfferings.map((offering) => (
              <div
                key={offering.offering_id}
                onClick={() => handleCourseClick(offering)}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 hover:border-blue-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1 truncate group-hover:text-blue-100 transition-colors">{offering.course?.title}</h3>
                      <p className="text-blue-200 text-sm font-mono">{offering.course?.code}</p>
                    </div>
                    <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-100" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-gray-400 text-xs font-semibold mb-1">PENDING</p>
                      <p className="text-2xl font-bold text-blue-400">{offering.enrollments.length}</p>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs font-semibold mb-1">CREDITS</p>
                      <p className="text-lg font-bold text-gray-200">{offering.course?.ltp}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs font-semibold min-w-20">Session:</span>
                      <span className="text-gray-200 text-sm font-mono">{offering.offering?.acad_session}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs font-semibold min-w-20">Section:</span>
                      <span className="text-gray-200 text-sm">{offering.offering?.section || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Button */}
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group/btn">
                    Review Requests
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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

// Detail Page - Enrollments for a specific course
function ActionPendingDetailPage() {
  const user = useAuthStore((state) => state.user);
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
      
      // Fetch both pending instructor AND pending advisor enrollments
      const instructorResponse = await axiosClient.get('/enrollment/pending-instructor');
      const instructorEnrollments = instructorResponse.data.data || [];
      
      console.log('Instructor enrollments fetched:', instructorEnrollments.length);
      
      // Get all enrollments for this offering from the instructor endpoint
      const offeringEnrollments = instructorEnrollments.filter(
        e => e.offering_id === parseInt(offeringId)
      );

      console.log('Filtered to offering:', parseInt(offeringId), 'count:', offeringEnrollments.length);

      if (instructorEnrollments.length > 0) {
        const courseInfo = instructorEnrollments.find(e => e.offering_id === parseInt(offeringId));
        if (courseInfo) {
          setOffering(courseInfo.offering);
        }
      }

      setEnrollments(offeringEnrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId, currentStatus) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollmentId);
      
      // Determine what status to move to based on current status
      const newStatus = currentStatus === 'pending instructor approval' 
        ? 'pending advisor approval' 
        : 'enrolled';

      const response = await axiosClient.put(
        `/offering/${offeringId}/enrollments/${enrollmentId}`,
        { enrol_status: newStatus }
      );

      if (response.data.success) {
        if (newStatus === 'enrolled') {
          toast.success('Student enrolled successfully!');
          setEnrollments(enrollments.filter(e => e.enrollment_id !== enrollmentId));
        } else {
          toast.success('Enrollment sent to advisor for approval!');
          setEnrollments(enrollments.map(e =>
            e.enrollment_id === enrollmentId
              ? { ...e, enrol_status: newStatus }
              : e
          ));
        }
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

  const handleReject = async (enrollmentId, currentStatus) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollmentId);
      
      // Determine rejection status based on current status
      const newStatus = currentStatus === 'pending instructor approval'
        ? 'instructor rejected'
        : 'advisor rejected';

      const response = await axiosClient.put(
        `/offering/${offeringId}/enrollments/${enrollmentId}`,
        { enrol_status: newStatus }
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

  // Enrollments are already filtered to pending instructor approval at fetch time
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/action-pending')}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Pending Actions
        </button>

        {/* Main Content - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Details (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              {loading ? (
                <div className="loading loading-spinner loading-sm"></div>
              ) : offering && enrollments.length > 0 ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">{enrollments[0]?.course?.code}</h1>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-gray-700 mb-6">{enrollments[0]?.course?.title}</h2>

                  {/* Course Details */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Credits (L-T-P)</p>
                      <p className="text-sm font-semibold text-gray-900">{enrollments[0]?.course?.ltp || 'N/A'}</p>
                    </div>
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Academic Session</p>
                      <p className="text-sm font-semibold text-gray-900">{offering.acad_session}</p>
                    </div>
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Department</p>
                      <p className="text-sm font-semibold text-gray-900">{offering?.dept_name || 'N/A'}</p>
                    </div>
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Degree</p>
                      <p className="text-sm font-semibold text-gray-900">{offering?.degree || 'N/A'}</p>
                    </div>
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Section</p>
                      <p className="text-sm font-semibold text-gray-900">{offering.section || 'N/A'}</p>
                    </div>
                    <div className="border-b pb-4">
                      <p className="text-xs text-gray-600 font-semibold">Slot</p>
                      <p className="text-sm font-semibold text-gray-900">{offering?.slot || 'N/A'}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right: Pending Students */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="loading loading-spinner loading-lg"></div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Student Requests</h3>
                      <span className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                        {enrollments.filter(e => e.enrol_status === 'pending instructor approval' || e.enrol_status === 'pending advisor approval').length}
                      </span>
                    </div>
                  </div>

                  {/* Error State */}
                  {error && <div className="alert alert-error mb-6"><span>{error}</span></div>}

                  {/* Students Table */}
                  {enrollments.filter(e => e.enrol_status === 'pending instructor approval' || e.enrol_status === 'pending advisor approval').length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
                      <span>No pending enrollment requests</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.filter(e => e.enrol_status === 'pending instructor approval' || e.enrol_status === 'pending advisor approval').map((enrollment) => (
                            <tr key={enrollment.enrollment_id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {enrollment.student?.users?.email}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                                  enrollment.enrol_type === 'Credit'
                                    ? 'bg-blue-100 text-blue-800'
                                    : enrollment.enrol_type === 'Credit for Concentration'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : enrollment.enrol_type === 'Audit'
                                    ? 'bg-purple-100 text-purple-800'
                                    : enrollment.enrol_type === 'Remedial'
                                    ? 'bg-pink-100 text-pink-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {enrollment.enrol_type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                                  enrollment.enrol_status === 'pending instructor approval'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : enrollment.enrol_status === 'pending advisor approval'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : enrollment.enrol_status === 'enrolled'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : enrollment.enrol_status === 'completed'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : enrollment.enrol_status === 'instructor rejected'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                                }`}>
                                  {enrollment.enrol_status?.replaceAll('_', ' ') || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(enrollment.enrollment_id, enrollment.enrol_status)}
                                    disabled={actionUpdating === enrollment.enrollment_id}
                                    className="btn btn-sm btn-success text-white disabled:opacity-50"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(enrollment.enrollment_id, enrollment.enrol_status)}
                                    disabled={actionUpdating === enrollment.enrollment_id}
                                    className="btn btn-sm btn-error text-white disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionPendingPage;
