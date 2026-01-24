import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Mail,
  GraduationCap,
  UserCheck
} from 'lucide-react';

function MyPendingWorksPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [pendingAsInstructor, setPendingAsInstructor] = useState([]);
  const [pendingAsAdvisor, setPendingAsAdvisor] = useState([]);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUpdating, setActionUpdating] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }

    fetchMyPendingWorks();
  }, [isAuthenticated, user, navigate]);

  const fetchMyPendingWorks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/enrollment/my-pending-works');
      const data = response.data.data || {};
      
      setPendingAsInstructor(data.pendingAsInstructor || []);
      setPendingAsAdvisor(data.pendingAsAdvisor || []);
      setIsAdvisor(response.data.isAdvisor || false);
    } catch (err) {
      console.error('Error fetching pending works:', err);
      setError(err.response?.data?.message || 'Failed to load pending works');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollment, section) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollment.enrollment_id);

      let newStatus;
      let successMessage;

      if (section === 'instructor') {
        // Instructor approval: pending instructor approval -> pending advisor approval
        newStatus = 'pending advisor approval';
        successMessage = 'Enrollment approved! Sent to advisor for approval.';
      } else {
        // Advisor approval: pending advisor approval -> enrolled
        newStatus = 'enrolled';
        successMessage = 'Enrollment approved! Student is now enrolled.';
      }

      const response = await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );

      if (response.data.success) {
        toast.success(successMessage);
        // Remove the item from the appropriate list immediately for better UX
        if (section === 'instructor') {
          setPendingAsInstructor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        } else {
          setPendingAsAdvisor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        }
        // Refresh the data to ensure consistency
        await fetchMyPendingWorks();
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

  const handleReject = async (enrollment, section) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollment.enrollment_id);

      let newStatus;
      if (section === 'instructor') {
        newStatus = 'instructor rejected';
      } else {
        newStatus = 'advisor rejected';
      }

      const response = await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );

      if (response.data.success) {
        toast.success('Enrollment rejected');
        // Remove the item from the appropriate list immediately for better UX
        if (section === 'instructor') {
          setPendingAsInstructor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        } else {
          setPendingAsAdvisor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        }
        // Refresh the data to ensure consistency
        await fetchMyPendingWorks();
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

  const renderEnrollmentCard = (enrollment, section) => {
    const isProcessing = actionUpdating === enrollment.enrollment_id;
    const canApprove = enrollment.enrol_status === 'pending instructor approval' || 
                      enrollment.enrol_status === 'pending advisor approval';

    return (
      <div
        key={enrollment.enrollment_id}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg p-5 sm:p-6 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10"
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
            <span className="text-slate-400 text-sm">Course:</span>
            <div className="text-right">
              <span className="text-purple-300 font-semibold text-sm">
                {enrollment.course?.code}
              </span>
              <p className="text-slate-400 text-xs mt-0.5">{enrollment.course?.title}</p>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-sm">Enrollment Type:</span>
            <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
              {enrollment.enrol_type || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-sm">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              enrollment.enrol_status === 'pending instructor approval' || enrollment.enrol_status === 'pending advisor approval'
                ? 'bg-yellow-900/50 text-yellow-300'
                : 'bg-slate-700/50 text-slate-300'
            }`}>
              {enrollment.enrol_status?.replaceAll('_', ' ') || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {canApprove && (
          <div className="flex gap-2 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => handleApprove(enrollment, section)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
            </button>
            <button
              onClick={() => handleReject(enrollment, section)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              My Pending Works
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            Review and approve pending enrollment requests
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Clock className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-slate-300 text-lg">
              Loading pending works...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-1">
                  Error Loading Pending Works
                </h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Pending as Instructor Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  Pending as Instructor
                </h2>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
                  {pendingAsInstructor.length}
                </span>
              </div>

              {pendingAsInstructor.length === 0 ? (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 text-center backdrop-blur-sm">
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-green-200">
                    No pending instructor approvals at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {pendingAsInstructor.map(enrollment => 
                    renderEnrollmentCard(enrollment, 'instructor')
                  )}
                </div>
              )}
            </div>

            {/* Pending as Advisor Section - Only show if user is an advisor */}
            {isAdvisor && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Pending as Advisor
                  </h2>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
                    {pendingAsAdvisor.length}
                  </span>
                </div>

                {pendingAsAdvisor.length === 0 ? (
                  <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 text-center backdrop-blur-sm">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-200">
                      No pending advisor approvals at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {pendingAsAdvisor.map(enrollment => 
                      renderEnrollmentCard(enrollment, 'advisor')
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty State - Both sections empty */}
            {!isAdvisor && pendingAsInstructor.length === 0 && (
              <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-12 text-center backdrop-blur-sm">
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-green-300 mb-2">All Clear!</h3>
                <p className="text-green-200">
                  Great work! There are no pending enrollment requests awaiting your action right now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPendingWorksPage;
