import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyAdviseesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [advisees, setAdvisees] = useState([]);
  const [advisorInfo, setAdvisorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdvisees();
  }, []);

  const fetchAdvisees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/enrollment/advisees');
      
      if (response.data.success) {
        setAdvisees(response.data.data || []);
        setAdvisorInfo(response.data.advisorInfo);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching advisees:', err);
      setError(err.response?.data?.message || 'Failed to load advisees');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (studentId) => {
    navigate(`/faculty-advisees/${studentId}`);
  };

  if (!user || user.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">Only instructors can view their advisees.</p>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Faculty Advisees</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            View all students assigned under your advisory
          </p>
        </div>

        {/* Advisor Info Card */}
        {advisorInfo && (
          <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-500/30 rounded-lg p-4 sm:p-6 mb-6 backdrop-blur-sm">
            <p className="text-slate-300">
              <span className="text-purple-400 font-semibold">Degree:</span> {advisorInfo.degree} | 
              <span className="text-purple-400 font-semibold ml-4">Batch:</span> {advisorInfo.batch} |
              <span className="text-purple-400 font-semibold ml-4">Branch:</span> {advisorInfo.branch}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-purple-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-1">Error Loading Advisees</h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && advisees.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center backdrop-blur-sm">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Advisees Yet</h3>
            <p className="text-slate-400">
              You don't have any students assigned to your advisory yet.
            </p>
          </div>
        )}

        {/* Advisees Grid */}
        {!loading && !error && advisees.length > 0 && (
          <div>
            <div className="mb-4 text-slate-300 text-sm">
              Total Advisees: <span className="font-bold text-purple-400">{advisees.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {advisees.map((student) => (
                <div
                  key={student.student_id}
                  onClick={() => handleStudentClick(student.student_id)}
                  className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg p-5 sm:p-6 hover:border-purple-500/50 hover:from-slate-800/80 hover:to-slate-800/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                >
                  {/* Student Name */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {student.users?.first_name} {student.users?.last_name}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Email */}
                  <p className="text-sm text-slate-400 mb-4 truncate">
                    {student.users?.email}
                  </p>

                  {/* Details Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Branch:</span>
                      <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
                        {student.branch || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">CGPA:</span>
                      <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
                        {student.cgpa?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Credits:</span>
                      <span className="text-slate-200 font-semibold text-sm bg-slate-700/50 px-2 py-1 rounded">
                        {student.total_credits_completed || 0}
                      </span>
                    </div>

                    {/* Enrollment Status */}
                    {student.enrollments && student.enrollments.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-3 mt-3">
                        <p className="text-xs text-slate-400 font-semibold mb-2">
                          Current Enrollments: {student.enrollments.length}
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {student.enrollments.map((enrollment, idx) => (
                            <div
                              key={enrollment.enrollment_id}
                              className="text-xs bg-slate-700/30 px-2 py-1 rounded flex justify-between items-start gap-1"
                            >
                              <span className="text-slate-300 truncate flex-1">
                                {enrollment.course_offering?.course?.code || 'Unknown'}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                                  enrollment.enrol_status === 'enrolled'
                                    ? 'bg-green-900/50 text-green-300'
                                    : enrollment.enrol_status?.includes('pending')
                                    ? 'bg-yellow-900/50 text-yellow-300'
                                    : 'bg-slate-700/50 text-slate-300'
                                }`}
                              >
                                {enrollment.enrol_status || 'Unknown'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!student.enrollments || student.enrollments.length === 0) && (
                      <div className="border-t border-slate-700/50 pt-3 mt-3 text-center">
                        <p className="text-xs text-slate-500">No active enrollments</p>
                      </div>
                    )}
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
