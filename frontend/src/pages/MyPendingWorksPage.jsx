import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Check,
  X,
  AlertCircle,
  Mail,
  GraduationCap,
  UserCheck,
  Search,
  ChevronDown
} from 'lucide-react';

/* ================= FILTER DROPDOWN ================= */
function FilterDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);

  const toggleOption = (opt) => {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    setSelected(newSet);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 flex items-center gap-2 hover:bg-gray-50"
      >
        {label}
        {selected.size > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
            {selected.size}
          </span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-left"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${selected.has(opt)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300'
                  }`}
              >
                {selected.has(opt) && <Check className="w-3 h-3" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  // 🔥 Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchMyPendingWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);


  const fetchMyPendingWorks = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/enrollment/my-pending-works');
      const data = response.data.data || {};


      setPendingAsInstructor(data.pendingAsInstructor || []);
      setPendingAsAdvisor(data.pendingAsAdvisor || []);
      setIsAdvisor(response.data.isAdvisor || false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending works');
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER OPTIONS ================= */

  const allEnrollments = useMemo(
    () => [...pendingAsInstructor, ...pendingAsAdvisor],
    [pendingAsInstructor, pendingAsAdvisor]
  );

  const availableCourses = useMemo(() => {
    const set = new Set();
    allEnrollments.forEach(e => {
      if (e.course?.code) set.add(`${e.course.code} - ${e.course.title}`);
    });
    return [...set];
  }, [allEnrollments]);

  const availableTypes = useMemo(() => {
    const set = new Set();
    allEnrollments.forEach(e => e.enrol_type && set.add(e.enrol_type));
    return [...set];
  }, [allEnrollments]);

  const normalize = (v) => (v || "").toLowerCase().trim();

  const applyFilters = (list) => {
    const q = normalize(searchQuery);

    return list.filter(e => {
      const courseName = `${e.course?.code} - ${e.course?.title}`;

      const searchMatch =
        !q ||
        normalize(e.student?.users?.first_name).includes(q) ||
        normalize(e.student?.users?.last_name).includes(q) ||
        normalize(e.student?.users?.email).includes(q) ||
        normalize(courseName).includes(q);

      const courseMatch =
        courseFilter.size === 0 || courseFilter.has(courseName);

      const typeMatch =
        typeFilter.size === 0 || typeFilter.has(e.enrol_type);

      return searchMatch && courseMatch && typeMatch;
    });
  };

  const filteredInstructor = useMemo(
    () => applyFilters(pendingAsInstructor),
    [pendingAsInstructor, searchQuery, courseFilter, typeFilter]
  );

  const filteredAdvisor = useMemo(
    () => applyFilters(pendingAsAdvisor),
    [pendingAsAdvisor, searchQuery, courseFilter, typeFilter]
  );

  /* ================= ACTIONS ================= */

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

      await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );

      toast.success(successMessage);
      fetchMyPendingWorks();
    } catch {
      toast.error("Approval failed");
    } finally {
      setActionUpdating(null);
    }
  };

  const handleReject = async (enrollment, section) => {
    if (actionUpdating) return;
    try {
      setActionUpdating(enrollment.enrollment_id);

      const newStatus =
        section === 'instructor'
          ? 'instructor rejected'
          : 'advisor rejected';

      await axiosClient.put(
        `/offering/${enrollment.offering_id}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: newStatus }
      );


      toast.success("Rejected");
      fetchMyPendingWorks();
    } catch {
      toast.error("Reject failed");
    } finally {
      setActionUpdating(null);
    }
  };

  // ✅ BULK APPROVE BASED ON FILTERED DATA
  const handleBulkApprove = async (list, section) => {
    if (list.length === 0 || actionUpdating) return;


    try {
      setActionUpdating("bulk");

      const requests = list.map(e => {
        const newStatus =
          section === 'instructor'
            ? 'pending advisor approval'
            : 'enrolled';

        return axiosClient.put(
          `/offering/${e.offering_id}/enrollments/${e.enrollment_id}`,
          { enrol_status: newStatus }
        );
      });

      await Promise.all(requests);

      toast.success(`Approved ${list.length} filtered records`);
      fetchMyPendingWorks();
    } catch {
      toast.error("Bulk approval failed");
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
        <div className="bg-white border rounded-lg p-8 text-center">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-gray-600">No matching records.</p>
        </div>
      );
    }


    return (
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(e => (
                <tr key={e.enrollment_id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium">
                      {e.student?.users?.first_name} {e.student?.users?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {e.student?.users?.email}
                    </div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="font-medium text-blue-600">
                      {e.course?.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {e.course?.title}
                    </div>
                  </td>

                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {e.enrol_type}
                    </span>
                  </td>

                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs capitalize">
                      {e.enrol_status?.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleApprove(e, section)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(e, section)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching your pending tasks...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <UserCheck className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold">My Pending Works</h1>
        </div>


        {/* 🔥 FILTER BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or course..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {availableCourses.length > 0 && (
            <FilterDropdown
              label="Course"
              options={availableCourses}
              selected={courseFilter}
              setSelected={setCourseFilter}
            />
          )}

          {availableTypes.length > 0 && (
            <FilterDropdown
              label="Enrollment Type"
              options={availableTypes}
              selected={typeFilter}
              setSelected={setTypeFilter}
            />
          )}

          {(searchQuery || courseFilter.size > 0 || typeFilter.size > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCourseFilter(new Set());
                setTypeFilter(new Set());
              }}
              className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* INSTRUCTOR SECTION */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Pending as Instructor ({filteredInstructor.length})
            </h2>

            {filteredInstructor.length > 0 && (
              <button
                onClick={() => handleBulkApprove(filteredInstructor, "instructor")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
              >
                Approve Filtered
              </button>
            )}
          </div>

          {renderTable(filteredInstructor, "instructor")}
        </div>

        {/* ADVISOR SECTION */}
        {isAdvisor && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Pending as Advisor ({filteredAdvisor.length})
              </h2>

              {filteredAdvisor.length > 0 && (
                <button
                  onClick={() => handleBulkApprove(filteredAdvisor, "advisor")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                >
                  Approve Filtered
                </button>
              )}
            </div>

            {renderTable(filteredAdvisor, "advisor")}
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
