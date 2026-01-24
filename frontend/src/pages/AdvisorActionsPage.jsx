import { useEffect, useState } from 'react';
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
  Mail 
} from 'lucide-react';

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
      console.log('Filtered enrollments for advisor approval:', allEnrollments);

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

  // If studentId param exists, show detail page
  if (studentId) {
    const enrollment = enrollments.find(
      e => e.enrollment_id === parseInt(studentId)
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
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Advisor Pending Actions
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            Review and approve pending student enrollment requests
          </p>
        </div>

        {/* Advisor Info Card */}
        {advisorInfo && (
          <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-500/30 rounded-lg p-4 sm:p-6 mb-6 backdrop-blur-sm">
            <p className="text-slate-300 text-sm sm:text-base">
              <span className="text-purple-400 font-semibold">Degree:</span> {advisorInfo.degree} | 
              <span className="text-purple-400 font-semibold ml-4">Batch:</span> {advisorInfo.batch} |
              <span className="text-purple-400 font-semibold ml-4">Branch:</span> {advisorInfo.branch}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Clock className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-slate-300 text-lg">
              Loading enrollment requests...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-1">
                  Error Loading Pending Requests
                </h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-8 text-center backdrop-blur-sm">
            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-green-300 mb-2">All Clear!</h3>
            <p className="text-green-200">
              Great work! There are no pending enrollment requests awaiting your advisor approval at the moment.
            </p>
          </div>
        )}

        {/* Students Grid */}
        {!loading && !error && enrollments.length > 0 && (
          <div>
            <div className="mb-4 text-slate-300 text-sm">
              Pending Requests: <span className="font-bold text-purple-400">{enrollments.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.enrollment_id}
                  onClick={() => navigate(`/advisor-actions/${enrollment.enrollment_id}`)}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg p-5 sm:p-6 hover:border-purple-500/50 hover:from-slate-800/80 hover:to-slate-800/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer group"
                >
                  {/* Student Name */}
                  <h3 className="text-lg font-bold text-white mb-1">
                    {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
                  </h3>
                  
                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 truncate">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{enrollment.student?.users?.email}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 mb-4 border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Branch:</span>
                      <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
                        {enrollment.student?.branch || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Enrollment Type:</span>
                      <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
                        {enrollment.enrol_type || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-purple-300 font-semibold text-sm">
                          {enrollment.course?.code}
                        </p>
                        <p className="text-slate-400 text-xs">{enrollment.course?.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge and Arrow */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                    <span className="bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">
                      Pending Approval
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
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
      <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/advisor-actions')}
            className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Pending Actions
          </button>

          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-300 mb-2">Enrollment Not Found</h2>
            <p className="text-red-200">The enrollment record could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const isPendingApproval = enrollment.enrol_status === 'pending advisor approval';

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/advisor-actions')}
          className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Pending Actions
        </button>

        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg p-6 sm:p-8 backdrop-blur-sm mb-6">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-2">
              {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
            </h1>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4" />
              <span>{enrollment.student?.users?.email}</span>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-1">Degree</p>
              <p className="text-white text-lg font-semibold">
                {enrollment.student?.degree || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-1">Batch</p>
              <p className="text-white text-lg font-semibold">
                {enrollment.student?.batch || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-1">Branch</p>
              <p className="text-white text-lg font-semibold">
                {enrollment.student?.branch || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-1">Enrollment Type</p>
              <p className="text-white text-lg font-semibold">
                {enrollment.enrol_type || 'N/A'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 pb-6 border-b border-slate-700">
            <p className="text-slate-400 text-sm font-semibold mb-2">Current Status</p>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-900/50 text-yellow-300 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {enrollment.enrol_status?.replaceAll('_', ' ') || 'Unknown'}
              </span>
              {!isPendingApproval && (
                <span className="text-slate-400 text-sm">
                  (This enrollment cannot be modified)
                </span>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-purple-300 font-semibold">{enrollment.course?.code}</p>
                <p className="text-slate-400 text-sm">{enrollment.course?.title}</p>
                <p className="text-slate-500 text-xs mt-2">
                  Session: {enrollment.offering?.acad_session} | Section: {enrollment.offering?.section || 'N/A'} | LTP: {enrollment.course?.ltp}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isPendingApproval ? (
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
              <span>{processing ? 'Approving...' : 'Approve'}</span>
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
              <span>{processing ? 'Rejecting...' : 'Reject'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 text-center backdrop-blur-sm">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold mb-1">Cannot Approve/Reject</p>
            <p className="text-slate-400 text-sm">
              This enrollment is not pending advisor approval. Current status: {enrollment.enrol_status?.replaceAll('_', ' ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvisorActionsPage;
