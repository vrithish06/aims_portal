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
  AlertCircle,
  Mail,
  GraduationCap,
  UserCheck
} from 'lucide-react';


function MyPendingWorksPage() {
  // --- AUTH & NAVIGATION ---
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();


  // --- STATE MANAGEMENT ---
  const [pendingAsInstructor, setPendingAsInstructor] = useState([]);
  const [pendingAsAdvisor, setPendingAsAdvisor] = useState([]);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUpdating, setActionUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  // --- INITIAL LOAD & PROTECTION ---
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchMyPendingWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);


  // --- API: FETCH WORKS ---
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


  // --- API: APPROVE LOGIC ---
  const handleApprove = async (enrollment, section) => {
    if (actionUpdating) return;
    try {
      setActionUpdating(enrollment.enrollment_id);
      let newStatus;
      let successMessage;


      if (section === 'instructor') {
        newStatus = 'pending advisor approval';
        successMessage = 'Enrollment approved! Sent to advisor for approval.';
      } else {
        newStatus = 'enrolled';
        successMessage = 'Enrollment approved! Student is now enrolled.';
      }


      const response = await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );


      if (response.data.success) {
        toast.success(successMessage);
        // Optimistic UI Update
        if (section === 'instructor') {
          setPendingAsInstructor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        } else {
          setPendingAsAdvisor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        }
        await fetchMyPendingWorks(); // Refresh for data consistency
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


  // --- API: REJECT LOGIC ---
  const handleReject = async (enrollment, section) => {
    if (actionUpdating) return;
    try {
      setActionUpdating(enrollment.enrollment_id);
      let newStatus = section === 'instructor' ? 'instructor rejected' : 'advisor rejected';


      const response = await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );


      if (response.data.success) {
        toast.success('Enrollment rejected');
        if (section === 'instructor') {
          setPendingAsInstructor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        } else {
          setPendingAsAdvisor(prev => prev.filter(e => e.enrollment_id !== enrollment.enrollment_id));
        }
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


  const handleBulkApprove = async (list) => {
    if (list.length === 0 || actionUpdating) return;


    try {
      setActionUpdating('bulk');
      const enrollmentIds = list.map(e => e.enrollment_id);


      const response = await axiosClient.post('/enrollment/bulk-approve', {
        enrollmentIds
      });


      if (response.data.success) {
        toast.success(response.data.message);
        await fetchMyPendingWorks();
      } else {
        toast.error(response.data.message || 'Failed to bulk approve');
      }
    } catch (err) {
      console.error('Error bulk approving:', err);
      toast.error(err.response?.data?.message || 'Failed to bulk approve');
    } finally {
      setActionUpdating(null);
    }
  };


  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">Only instructors can access the pending works dashboard.</p>
        </div>
      </div>
    );
  }


  const renderTable = (data, section) => {
    if (data.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">
            No pending {section === 'instructor' ? 'instructor' : 'advisor'} approvals.
          </p>
        </div>
      );
    }


    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Course</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Enrollment Type</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Current Status</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((enrollment) => {
                const isProcessing = actionUpdating === enrollment.enrollment_id || actionUpdating === 'bulk';


                return (
                  <tr key={enrollment.enrollment_id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1.5 mt-0.5 text-xs">
                          <Mail className="w-3 h-3" />
                          {enrollment.student?.users?.email}
                        </div>
                      </div>
                    </td>


                    {/* Course Info */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-blue-600">
                          {enrollment.course?.code}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 max-w-[200px] truncate" title={enrollment.course?.title}>
                          {enrollment.course?.title}
                        </div>
                      </div>
                    </td>


                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {enrollment.enrol_type || 'N/A'}
                      </span>
                    </td>


                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                        {enrollment.enrol_status?.replaceAll('_', ' ') || 'Unknown'}
                      </span>
                    </td>


                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(enrollment, section)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                          {isProcessing && actionUpdating !== 'bulk' ? 'Processing' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(enrollment, section)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                          {isProcessing && actionUpdating !== 'bulk' ? 'Processing' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              My Pending Works
            </h1>
          </div>
          <p className="text-gray-600">
            Review and approve pending enrollment requests
          </p>
        </div>


        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner text-blue-600 w-8 h-8"></div>
            <span className="ml-3 text-gray-500 text-lg">
              Loading pending works...
            </span>
          </div>
        )}


        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-1">
                  Error
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}


        {/* Content */}
        {!loading && !error && (
          <div className="space-y-12">
            {/* Pending as Instructor Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Pending as Instructor
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm">
                    {pendingAsInstructor.length} request{pendingAsInstructor.length !== 1 ? 's' : ''}
                  </span>
                  {pendingAsInstructor.length > 0 && (
                    <button
                      onClick={() => handleBulkApprove(pendingAsInstructor)}
                      disabled={actionUpdating === 'bulk'}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {actionUpdating === 'bulk' ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Approve All
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {renderTable(pendingAsInstructor, 'instructor')}
            </div>


            {/* ADVISOR COLUMN */}
            {isAdvisor && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Pending as Advisor
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold text-sm">
                      {pendingAsAdvisor.length} request{pendingAsAdvisor.length !== 1 ? 's' : ''}
                    </span>
                    {pendingAsAdvisor.length > 0 && (
                      <button
                        onClick={() => handleBulkApprove(pendingAsAdvisor)}
                        disabled={actionUpdating === 'bulk'}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {actionUpdating === 'bulk' ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve All
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {renderTable(pendingAsAdvisor, 'advisor')}
              </div>
            )}


            {/* Empty State - Both sections empty */}
            {!isAdvisor && pendingAsInstructor.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-500">
                  You have no pending enrollment requests to review.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// Simple Placeholder for empty sections
function EmptyState({ message }) {
  return (
    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
      <Check className="w-10 h-10 text-green-400 mx-auto mb-2 opacity-50" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-tight">{message}</p>
    </div>
  );
}


export default MyPendingWorksPage;
