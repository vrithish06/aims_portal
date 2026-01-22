import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Users, ArrowLeft, BookOpen, ChevronDown, Check } from 'lucide-react';

function CourseDetailsPage() {
  const { offeringId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [offering, setOffering] = useState(location.state?.offering || null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(!offering);
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [approving, setApproving] = useState(null);
  const [approveAll, setApproveAll] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState(new Set());
  const user = useAuthStore((state) => state.user);
  const isTeacherOrAdmin = user?.role === 'instructor' || user?.role === 'admin';

  useEffect(() => {
    if (!offering) {
      fetchOfferingDetails();
    } else {
      fetchEnrolledStudents();
    }
  }, [offeringId]);

  const fetchOfferingDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/offering/${offeringId}`);
      if (response.data.success) {
        setOffering(response.data.data);
        fetchEnrolledStudents();
      }
    } catch (error) {
      toast.error('Failed to load course details');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await axiosClient.get(`/offering/${offeringId}/enrollments`);
      if (response.data.success) {
        setEnrolledStudents(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
      setEnrolledStudents([]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <span>Course not found</span>
          </div>
        </div>
      </div>
    );
  }

  const course = offering.course;
  const instructor = offering.instructor?.users;

  // Get unique enrollment types and statuses
  const uniqueEnrollmentTypes = [...new Set(enrolledStudents.map(s => s.enrol_type).filter(Boolean))];
  const uniqueStatuses = [...new Set(enrolledStudents.map(s => s.enrol_status).filter(Boolean))];

  // Filter students based on selected filters
  const filteredStudents = enrolledStudents.filter(student => {
    const typeMatch = enrollmentTypeFilter.length === 0 || enrollmentTypeFilter.includes(student.enrol_type);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(student.enrol_status);
    return typeMatch && statusMatch;
  });

  const toggleEnrollmentTypeFilter = (type) => {
    setEnrollmentTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleApproveStudent = async (enrollment) => {
    try {
      setApproving(enrollment.enrollment_id);
      // Instructor approves pending_instructor_approval -> pending_advisor_approval
      const response = await axiosClient.put(
        `/offering/${offeringId}/enrollments/${enrollment.enrollment_id}`,
        { enrol_status: 'pending_advisor_approval' }
      );

      if (response.data.success) {
        toast.success('Student approved by instructor. Pending advisor approval.');
        fetchEnrolledStudents();
        setSelectedForApproval(prev => {
          const newSet = new Set(prev);
          newSet.delete(enrollment.enrollment_id);
          return newSet;
        });
      }
    } catch (error) {
      toast.error('Failed to approve student');
      console.error('Approval error:', error);
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    const pendingStudents = filteredStudents.filter(s => s.enrol_status === 'pending instructor approval');
    
    if (pendingStudents.length === 0) {
      toast.error('No pending students to approve');
      return;
    }

    try {
      setApproveAll(true);
      
      // Approve all pending students
      const approvalPromises = pendingStudents.map(student =>
        axiosClient.put(
          `/offering/${offeringId}/enrollments/${student.enrollment_id}`,
          { enrol_status: 'pending_advisor_approval' }
        )
      );

      const results = await Promise.all(approvalPromises);
      const allSuccessful = results.every(r => r.data.success);

      if (allSuccessful) {
        toast.success(`${pendingStudents.length} students approved successfully. Pending advisor approval.`);
        fetchEnrolledStudents();
        setSelectedForApproval(new Set());
      } else {
        toast.error('Some students could not be approved');
      }
    } catch (error) {
      toast.error('Failed to approve students');
      console.error('Bulk approval error:', error);
    } finally {
      setApproveAll(false);
    }
  };

  const clearFilters = () => {
    setEnrollmentTypeFilter([]);
    setStatusFilter([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course Offerings
        </button>

        {/* Main Content - Horizontal Layout (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Details (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">{course?.code}</h1>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  offering.status === 'Enrolling' ? 'bg-green-100 text-green-800' : 
                  offering.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                  offering.status === 'Running' ? 'bg-yellow-100 text-yellow-800' : 
                  offering.status === 'Proposed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {offering.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-700 mb-6">{course?.title}</h2>

              {/* Course Details */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Credits (L-T-P)</p>
                  <p className="text-sm font-semibold text-gray-900">{course?.ltp || 'N/A'}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Academic Session</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.acad_session}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Department</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.dept_name}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Degree</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.degree || 'N/A'}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Section</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.section || 'N/A'}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Slot</p>
                  <p className="text-sm font-semibold text-gray-900">{offering.slot || 'N/A'}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs text-gray-600 font-semibold">Instructor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Instructor Email</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{instructor?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Enrolled Students */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Enrolled Students</h3>
                <span className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                  {filteredStudents.length}
                </span>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
                  <span>No students enrolled in this course yet.</span>
                </div>
              ) : (
                <>
                  {/* Filter Controls */}
                  {(enrollmentTypeFilter.length > 0 || statusFilter.length > 0) && (
                    <div className="mb-4 flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {enrollmentTypeFilter.map(type => (
                          <span key={type} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {type}
                          </span>
                        ))}
                        {statusFilter.map(status => (
                          <span key={status} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {status.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}

                  {/* Approve All Button - Only for Teacher/Admin when pending students filtered */}
                  {isTeacherOrAdmin && statusFilter.includes('pending instructor approval') && filteredStudents.some(s => s.enrol_status === 'pending instructor approval') && (
                    <div className="mb-4">
                      <button
                        onClick={handleApproveAll}
                        disabled={approveAll}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {approveAll ? 'Approving All...' : 'Accept All'}
                      </button>
                    </div>
                  )}

                  {/* Table */}
                  {filteredStudents.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
                      <span>No students match the selected filters.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200">
                            {isTeacherOrAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-10"></th>}
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 relative group cursor-pointer">
                              <div className="flex items-center gap-1">
                                Enrollment Type
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </div>
                              {/* Dropdown */}
                              <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="p-3 space-y-2">
                                  {uniqueEnrollmentTypes.map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                      <input
                                        type="checkbox"
                                        checked={enrollmentTypeFilter.includes(type)}
                                        onChange={() => toggleEnrollmentTypeFilter(type)}
                                        className="w-4 h-4 rounded border-gray-300"
                                      />
                                      <span className="text-sm text-gray-700">{type}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 relative group cursor-pointer">
                              <div className="flex items-center gap-1">
                                Status
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </div>
                              {/* Dropdown */}
                              <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="p-3 space-y-2">
                                  {uniqueStatuses.map(status => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                      <input
                                        type="checkbox"
                                        checked={statusFilter.includes(status)}
                                        onChange={() => toggleStatusFilter(status)}
                                        className="w-4 h-4 rounded border-gray-300"
                                      />
                                      <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </th>
                            {isTeacherOrAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((enrollment, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                              {isTeacherOrAdmin && (
                                <td className="px-6 py-4 text-sm">
                                  {enrollment.enrol_status === 'pending instructor approval' && (
                                    <input
                                      type="checkbox"
                                      checked={selectedForApproval.has(enrollment.enrollment_id)}
                                      onChange={() => {
                                        const newSet = new Set(selectedForApproval);
                                        if (newSet.has(enrollment.enrollment_id)) {
                                          newSet.delete(enrollment.enrollment_id);
                                        } else {
                                          newSet.add(enrollment.enrollment_id);
                                        }
                                        setSelectedForApproval(newSet);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300"
                                    />
                                  )}
                                  {enrollment.enrol_status === 'enrolled' && statusFilter.includes('pending instructor approval') && (
                                    <Check className="w-5 h-5 text-green-600" />
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4 text-sm text-gray-900">{enrollment.student_name || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 break-all">{enrollment.student_email || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {enrollment.enrol_type || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  enrollment.enrol_status === 'enrolled' ? 'bg-green-100 text-green-800' : 
                                  enrollment.enrol_status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                  enrollment.enrol_status === 'pending instructor approval' ? 'bg-yellow-100 text-yellow-800' :
                                  enrollment.enrol_status === 'pending advisor approval' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {enrollment.enrol_status}
                                </span>
                              </td>
                              {isTeacherOrAdmin && (
                                <td className="px-6 py-4 text-sm">
                                  {enrollment.enrol_status === 'pending instructor approval' && (
                                    <button
                                      onClick={() => handleApproveStudent(enrollment)}
                                      disabled={approving === enrollment.enrollment_id}
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                                    >
                                      {approving === enrollment.enrollment_id ? 'Approving...' : 'Approve'}
                                    </button>
                                  )}
                                </td>
                              )}
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

export default CourseDetailsPage;
