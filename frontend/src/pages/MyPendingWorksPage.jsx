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
  Search,
  Filter,
  Mail,
  GraduationCap,
  UserCheck,
  AlertCircle,
  Briefcase
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

  // --- UI: RENDER ENROLLMENT CARD ---
  const renderEnrollmentCard = (enrollment, section) => {
    const isProcessing = actionUpdating === enrollment.enrollment_id;
    const canApprove = enrollment.enrol_status === 'pending instructor approval' || 
                       enrollment.enrol_status === 'pending advisor approval';

    return (
      <div key={enrollment.enrollment_id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden">
        {/* Top Badges */}
        <div className="p-4 pb-2 flex justify-between items-start">
          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
            {enrollment.course?.code || 'PH101'}
          </span>
          <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight">
            Enrolling
          </span>
        </div>

        {/* Header Info */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-black text-gray-900 leading-tight truncate capitalize">
            {enrollment.student?.users?.first_name} {enrollment.student?.users?.last_name}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-400 mt-1">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium truncate">{enrollment.student?.users?.email}</span>
          </div>
        </div>

        {/* Information Grid (The "Slot/Sec/Total" Style) */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100/30 text-center">
            <p className="text-[8px] font-bold text-orange-400 uppercase mb-0.5 tracking-tighter">Slot</p>
            <p className="text-[11px] font-black text-gray-700 truncate">{enrollment.enrol_type || 'HCPE'}</p>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg border border-purple-100/30 text-center">
            <p className="text-[8px] font-bold text-purple-400 uppercase mb-0.5 tracking-tighter">Sec</p>
            <p className="text-[11px] font-black text-gray-700">M5</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100/30 text-center">
            <p className="text-[8px] font-bold text-blue-400 uppercase mb-0.5 tracking-tighter">Total</p>
            <p className="text-[11px] font-black text-gray-700">3</p>
          </div>
        </div>

        {/* Details Footer */}
        <div className="px-4 pb-4 flex justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50/50 mb-3">
          <div className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 opacity-50" />
            <span>CSE</span>
          </div>
          <span>ID: {enrollment.enrollment_id}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto p-3 pt-0 flex flex-col gap-2">
          {canApprove && (
            <>
              <button
                onClick={() => handleApprove(enrollment, section)}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
              >
                {isProcessing ? 'Processing...' : 'Manage & View Details'}
              </button>
              <button
                onClick={() => handleReject(enrollment, section)}
                disabled={isProcessing}
                className="w-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold py-1.5 rounded-lg text-[10px] transition-all"
              >
                Reject Request
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // --- ACCESS DENIED UI ---
  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">Only instructors can access the pending works dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Pending Works</h1>
            </div>
            <p className="text-slate-500 font-bold">Total works managed: {pendingAsInstructor.length + (isAdvisor ? pendingAsAdvisor.length : 0)}</p>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-slate-600 font-extrabold text-xs shadow-sm hover:bg-gray-50 transition-all">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student name or course code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-sm font-medium text-sm"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center max-w-xl mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-red-900 font-black">Error Loading Data</h3>
            <p className="text-red-700 text-sm mt-1 font-medium">{error}</p>
            <button onClick={fetchMyPendingWorks} className="mt-4 text-xs font-black text-red-600 underline">Try Again</button>
          </div>
        ) : (
          /* SIDE-BY-SIDE GRID */
          <div className={`grid grid-cols-1 ${isAdvisor ? 'lg:grid-cols-2' : ''} gap-8 items-start`}>
            
            {/* INSTRUCTOR COLUMN */}
            <section className="bg-white/40 p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Instructor Queue
                </h2>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingAsInstructor.length}
                </span>
              </div>
              
              {pendingAsInstructor.length === 0 ? (
                <EmptyState message="No instructor approvals pending" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingAsInstructor
                    .filter(e => 
                      `${e.student?.users?.first_name} ${e.student?.users?.last_name} ${e.course?.code}`
                      .toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(item => renderEnrollmentCard(item, 'instructor'))}
                </div>
              )}
            </section>

            {/* ADVISOR COLUMN */}
            {isAdvisor && (
              <section className="bg-white/40 p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Advisor Queue
                  </h2>
                  <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pendingAsAdvisor.length}
                  </span>
                </div>

                {pendingAsAdvisor.length === 0 ? (
                  <EmptyState message="No advisor approvals pending" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingAsAdvisor
                      .filter(e => 
                        `${e.student?.users?.first_name} ${e.student?.users?.last_name} ${e.course?.code}`
                        .toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(item => renderEnrollmentCard(item, 'advisor'))}
                  </div>
                )}
              </section>
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