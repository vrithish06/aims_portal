import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Check, X, ArrowLeft, User, Mail, GraduationCap } from 'lucide-react';

function StudentAdvisorDetailPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }

    fetchStudentEnrollments();
  }, [isAuthenticated, user, navigate, studentId]);

  const fetchStudentEnrollments = async () => {
    try {
      setLoading(true);

      // Fetch all pending advisor enrollments
      const response = await axiosClient.get('/enrollment/pending-advisor');
      const allEnrollments = response.data.data || [];

      // Filter enrollments for this specific student
      const studentEnrollments = allEnrollments.filter(
        (e) => e.student_id === parseInt(studentId)
      );

      if (studentEnrollments.length > 0) {
        setStudentData(studentEnrollments[0].student);
      }

      setEnrollments(studentEnrollments);
    } catch (err) {
      console.error('Error fetching student enrollments:', err);
      toast.error('Failed to load student enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    setProcessingIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await axiosClient.put(`/enrollment/advisor/${enrollmentId}`, {
        enrol_status: 'enrolled',
      });

      toast.success('Enrollment approved! Student is now enrolled.');
      
      // Remove from local state
      setEnrollments((prev) =>
        prev.filter((e) => e.enrollment_id !== enrollmentId)
      );
    } catch (err) {
      console.error('Error approving enrollment:', err);
      toast.error(err.response?.data?.message || 'Failed to approve enrollment');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  const handleReject = async (enrollmentId) => {
    setProcessingIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await axiosClient.put(`/enrollment/advisor/${enrollmentId}`, {
        enrol_status: 'advisor rejected',
      });

      toast.success('Enrollment rejected');
      
      // Remove from local state
      setEnrollments((prev) =>
        prev.filter((e) => e.enrollment_id !== enrollmentId)
      );
    } catch (err) {
      console.error('Error rejecting enrollment:', err);
      toast.error(err.response?.data?.message || 'Failed to reject enrollment');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="flex justify-center items-center py-12">
          <Clock className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="ml-3 text-gray-300 text-lg">Loading student details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/faculty-advisees')}
          className="mb-6 flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Faculty Advisees</span>
        </button>

        {/* Student Header */}
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-600/20 rounded-full">
                <User className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {studentData?.users?.first_name} {studentData?.users?.last_name}
                </h1>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{studentData?.users?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{studentData?.degree} - {studentData?.branch}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Stats */}
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
              <div className="text-sm text-purple-300 mb-1">Pending Approvals</div>
              <div className="text-3xl font-bold text-white">
                {enrollments.filter(e => e.enrol_status === 'pending advisor approval').length}
              </div>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div>
              <p className="text-gray-400 text-sm mb-1">Batch</p>
              <p className="text-white font-semibold">{studentData?.batch}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Branch</p>
              <p className="text-white font-semibold">{studentData?.branch}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">CGPA</p>
              <p className="text-white font-semibold">{studentData?.cgpa || '0.00'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Credits</p>
              <p className="text-white font-semibold">{studentData?.total_credits_completed || 0}</p>
            </div>
          </div>
        </div>

        {/* Enrollments Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Course Enrollments</h2>

          {enrollments.length === 0 ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-8 text-center">
              <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-green-200">No pending enrollments for this student</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.enrollment_id}
                  className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    {/* Course Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">
                          {enrollment.course?.code}
                        </h3>
                      </div>
                      <p className="text-gray-300 mb-3">{enrollment.course?.title}</p>

                      <div className="flex flex-wrap gap-3">
                        <span className="bg-blue-500/20 border border-blue-500/50 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold">
                          {enrollment.enrol_type}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            enrollment.enrol_status === 'pending advisor approval'
                              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
                              : enrollment.enrol_status === 'enrolled'
                              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                              : 'bg-gray-500/20 border border-gray-500/50 text-gray-300'
                          }`}
                        >
                          {enrollment.enrol_status}
                        </span>
                        <span className="text-gray-400 text-sm">
                          LTP: {enrollment.course?.ltp}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Session: {enrollment.offering?.acad_session}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Only show if status is pending advisor approval */}
                    {enrollment.enrol_status === 'pending advisor approval' && (
                      <div className="flex items-center gap-3 ml-4">
                        <button
                          onClick={() => handleApprove(enrollment.enrollment_id)}
                          disabled={processingIds.has(enrollment.enrollment_id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {processingIds.has(enrollment.enrollment_id)
                              ? 'Approving...'
                              : 'Approve'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleReject(enrollment.enrollment_id)}
                          disabled={processingIds.has(enrollment.enrollment_id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>
                            {processingIds.has(enrollment.enrollment_id)
                              ? 'Rejecting...'
                              : 'Reject'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentAdvisorDetailPage;
const fetchStudentEnrollments = async () => {
  try {
    setLoading(true);

    // Use the new dedicated endpoint
    const response = await axiosClient.get(`/enrollment/student/${studentId}/pending`);
    
    if (response.data.success) {
      const { student, enrollments } = response.data.data;
      setStudentData(student);
      setEnrollments(enrollments);
    }
  } catch (err) {
    console.error('Error fetching student enrollments:', err);
    toast.error(err.response?.data?.message || 'Failed to load student enrollments');
  } finally {
    setLoading(false);
  }
};
