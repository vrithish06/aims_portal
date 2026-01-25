import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import {
  ChevronDown,
  BookOpen,
  Clock,
  Check,
  X,
  ArrowLeft,
  Users,
  ArrowRight,
  Search,
} from "lucide-react";

/* ================= FILTER DROPDOWN COMPONENT ================= */
function FilterDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (opt) => {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    setSelected(newSet);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 flex items-center gap-2 transition-all"
      >
        {label}
        {selected.size > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-500/30 text-blue-300 rounded-full">
            {selected.size}
          </span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-slate-700 transition-all text-left"
            >
              <span
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selected.has(opt)
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-slate-600"
                }`}
              >
                {selected.has(opt) && <Check className="w-4 h-4" />}
              </span>
              <span className="text-gray-300">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= MAIN PAGE - LIST OF COURSES WITH PENDING ================= */
function ActionPendingPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const { offeringId } = useParams();

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for list page
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "instructor") {
      navigate("/");
      return;
    }
    fetchPendingEnrollments();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get("/enrollment/pending-instructor");
      const enrollments = response.data.data || [];

      const groupedByOffering = enrollments.reduce((acc, enrollment) => {
        const id = enrollment.offering_id;
        if (!acc[id]) {
          acc[id] = {
            offering_id: id,
            course: enrollment.course,
            offering: enrollment.offering,
            enrollments: [],
          };
        }
        acc[id].enrollments.push(enrollment);
        return acc;
      }, {});

      setOfferings(Object.values(groupedByOffering));
    } catch (err) {
      console.error("Error fetching pending enrollments:", err);
      setError(err.response?.data?.message || "Failed to load pending enrollments");
    } finally {
      setLoading(false);
    }
  };

  // Available enrollment types for filter
  const availableTypes = useMemo(() => {
    const types = new Set();
    offerings.forEach((off) =>
      off.enrollments.forEach((e) => types.add(e.enrol_type))
    );
    return Array.from(types).sort();
  }, [offerings]);

  // Filtered offerings
  const filteredOfferings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return offerings.filter((off) => {
      const searchMatch =
        query === "" ||
        off.course?.title?.toLowerCase().includes(query) ||
        off.course?.code?.toLowerCase().includes(query);

      const typeMatch =
        enrollmentTypeFilter.size === 0 ||
        off.enrollments.some((e) => enrollmentTypeFilter.has(e.enrol_type));

      return searchMatch && typeMatch && off.enrollments.length > 0;
    });
  }, [offerings, searchQuery, enrollmentTypeFilter]);

  const handleCourseClick = (offering) => {
    navigate(`/action-pending/${offering.offering_id}`, {
      state: { offering: offering.offering, course: offering.course },
    });
  };

  if (offeringId) {
    return <ActionPendingDetailPage />;
  }

  if (!isAuthenticated || user?.role !== "instructor") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-400 text-xl">Only instructors can view this page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
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

        {/* Filters */}
        {(availableTypes.length > 0 || searchQuery) && (
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search course..."
                className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {availableTypes.length > 0 && (
              <FilterDropdown
                label="Enrollment Type"
                options={availableTypes}
                selected={enrollmentTypeFilter}
                setSelected={setEnrollmentTypeFilter}
              />
            )}

            {(searchQuery || enrollmentTypeFilter.size > 0) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setEnrollmentTypeFilter(new Set());
                }}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="loading loading-spinner loading-lg text-blue-400"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl mb-8">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && filteredOfferings.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {offerings.length === 0 ? "No Pending Requests" : "No Matching Courses"}
            </h3>
            <p className="text-gray-400">
              {offerings.length === 0
                ? "You're all caught up! No pending enrollment requests."
                : "Try adjusting your filters."}
            </p>
          </div>
        )}

        {/* Course Grid */}
        {!loading && filteredOfferings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfferings.map((offering) => (
              <div
                key={offering.offering_id}
                onClick={() => handleCourseClick(offering)}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 hover:border-blue-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1 truncate">
                        {offering.course?.title}
                      </h3>
                      <p className="text-blue-200 text-sm font-mono">
                        {offering.course?.code}
                      </p>
                    </div>
                    <BookOpen className="w-6 h-6 text-blue-100 flex-shrink-0" />
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-gray-400 text-xs font-semibold">PENDING</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {offering.enrollments.length}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs font-semibold">CREDITS</p>
                      <p className="text-lg font-bold text-gray-200">
                        {offering.course?.ltp || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs font-semibold min-w-20">Session:</span>
                      <span className="text-gray-200 text-sm">
                        {offering.offering?.acad_session}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs font-semibold min-w-20">Section:</span>
                      <span className="text-gray-200 text-sm">
                        {offering.offering?.section || "N/A"}
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                    Review Requests
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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

/* ================= DETAIL PAGE - SPECIFIC COURSE PENDING REQUESTS ================= */
function ActionPendingDetailPage() {
  const { offeringId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [offering, setOffering] = useState(location.state?.offering || null);
  const [course, setCourse] = useState(location.state?.course || null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionUpdating, setActionUpdating] = useState(null);
  const [bulkInstructorLoading, setBulkInstructorLoading] = useState(false);
  const [bulkAdvisorLoading, setBulkAdvisorLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [offeringId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offeringRes, enrollRes] = await Promise.all([
        axiosClient.get(`/offering/${offeringId}`),
        axiosClient.get(`/offering/${offeringId}/enrollments`),
      ]);

      setOffering(offeringRes.data.data);
      setCourse(offeringRes.data.data.course);
      setEnrollments(enrollRes.data.data || []);
    } catch (err) {
      setError("Failed to load course data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableTypes = useMemo(() => {
    const types = new Set();
    enrollments.forEach((e) => e.enrol_type && types.add(e.enrol_type));
    return Array.from(types).sort();
  }, [enrollments]);

  const pendingInstructor = enrollments.filter(
    (e) => e.enrol_status === "pending instructor approval"
  );
  const pendingAdvisor = enrollments.filter(
    (e) => e.enrol_status === "pending advisor approval"
  );

  const applyFilters = (list) => {
    const query = searchQuery.toLowerCase().trim();
    return list.filter((e) => {
      const searchMatch =
        query === "" ||
        e.student_name?.toLowerCase().includes(query) ||
        e.student_email?.toLowerCase().includes(query);

      const typeMatch =
        enrollmentTypeFilter.size === 0 ||
        enrollmentTypeFilter.has(e.enrol_type);

      return searchMatch && typeMatch;
    });
  };

  const filteredInstructor = applyFilters(pendingInstructor);
  const filteredAdvisor = applyFilters(pendingAdvisor);

  const handleIndividualAction = async (enrollmentId, currentStatus, isApprove) => {
    if (actionUpdating) return;

    try {
      setActionUpdating(enrollmentId);

      let newStatus;
      if (isApprove) {
        newStatus =
          currentStatus === "pending instructor approval"
            ? "pending advisor approval"
            : "enrolled";
      } else {
        newStatus =
          currentStatus === "pending instructor approval"
            ? "instructor rejected"
            : "advisor rejected";
      }

      await axiosClient.put(`/offering/${offeringId}/enrollments/${enrollmentId}`, {
        enrol_status: newStatus,
      });

      toast.success(isApprove ? "Approved!" : "Rejected!");
      fetchData(); // Refresh
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setActionUpdating(null);
    }
  };

  const handleBulkInstructor = async () => {
    if (filteredInstructor.length === 0) return;
    try {
      setBulkInstructorLoading(true);
      const promises = filteredInstructor.map((e) =>
        axiosClient.put(`/offering/${offeringId}/enrollments/${e.enrollment_id}`, {
          enrol_status: "pending advisor approval",
        })
      );
      await Promise.all(promises);
      toast.success("All pending instructor requests moved to advisor approval");
      fetchData();
    } catch (err) {
      toast.error("Bulk action failed");
    } finally {
      setBulkInstructorLoading(false);
    }
  };

  const handleBulkAdvisor = async () => {
    if (filteredAdvisor.length === 0) return;
    try {
      setBulkAdvisorLoading(true);
      const promises = filteredAdvisor.map((e) =>
        axiosClient.put(`/offering/${offeringId}/enrollments/${e.enrollment_id}`, {
          enrol_status: "enrolled",
        })
      );
      await Promise.all(promises);
      toast.success("All pending advisor requests enrolled");
      fetchData();
    } catch (err) {
      toast.error("Bulk action failed");
    } finally {
      setBulkAdvisorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/action-pending")}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Pending Actions
        </button>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {availableTypes.length > 0 && (
            <FilterDropdown
              label="Enrollment Type"
              options={availableTypes}
              selected={enrollmentTypeFilter}
              setSelected={setEnrollmentTypeFilter}
            />
          )}

          {(searchQuery || enrollmentTypeFilter.size > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setEnrollmentTypeFilter(new Set());
              }}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-8 sticky top-6">
              {loading ? (
                <div className="loading loading-spinner loading-lg mx-auto"></div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <BookOpen className="w-10 h-10 text-blue-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{course?.code}</h1>
                      <h2 className="text-lg text-gray-700">{course?.title}</h2>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">Credits (L-T-P)</p>
                      <p className="font-bold">{course?.ltp || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Session</p>
                      <p className="font-bold">{offering?.acad_session || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Section</p>
                      <p className="font-bold">{offering?.section || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Slot</p>
                      <p className="font-bold">{offering?.slot || "N/A"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Pending Requests */}
          <div className="lg:col-span-2 space-y-12">
            {/* Pending Instructor Approval */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    Pending Instructor Approval
                  </h3>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                    {filteredInstructor.length}
                  </span>
                </div>
                {filteredInstructor.length > 0 && (
                  <button
                    onClick={handleBulkInstructor}
                    disabled={bulkInstructorLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {bulkInstructorLoading ? "Processing..." : "Approve All"}
                  </button>
                )}
              </div>

              {filteredInstructor.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending instructor requests</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstructor.map((e) => (
                        <tr key={e.enrollment_id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4 font-medium">{e.student_name}</td>
                          <td className="py-4 px-4 text-gray-600">{e.student_email}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold">
                              {e.enrol_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleIndividualAction(e.enrollment_id, e.enrol_status, true)}
                                disabled={actionUpdating === e.enrollment_id}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                <Check className="w-4 h-4 inline" /> Approve
                              </button>
                              <button
                                onClick={() => handleIndividualAction(e.enrollment_id, e.enrol_status, false)}
                                disabled={actionUpdating === e.enrollment_id}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                <X className="w-4 h-4 inline" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Advisor Approval */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    Pending Advisor Approval
                  </h3>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
                    {filteredAdvisor.length}
                  </span>
                </div>
                {filteredAdvisor.length > 0 && (
                  <button
                    onClick={handleBulkAdvisor}
                    disabled={bulkAdvisorLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {bulkAdvisorLoading ? "Processing..." : "Enroll All"}
                  </button>
                )}
              </div>

              {filteredAdvisor.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending advisor requests</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdvisor.map((e) => (
                        <tr key={e.enrollment_id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4 font-medium">{e.student_name}</td>
                          <td className="py-4 px-4 text-gray-600">{e.student_email}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold">
                              {e.enrol_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleIndividualAction(e.enrollment_id, e.enrol_status, true)}
                                disabled={actionUpdating === e.enrollment_id}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                <Check className="w-4 h-4 inline" /> Enroll
                              </button>
                              <button
                                onClick={() => handleIndividualAction(e.enrollment_id, e.enrol_status, false)}
                                disabled={actionUpdating === e.enrollment_id}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                <X className="w-4 h-4 inline" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionPendingPage;