import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Users, ArrowLeft, BookOpen } from 'lucide-react';

function CourseDetailsPage() {
  const { offeringId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [offering, setOffering] = useState(location.state?.offering || null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(!offering);
  const user = useAuthStore((state) => state.user);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course Offerings
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">{course?.code}</h1>
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">{course?.title}</h2>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              offering.status === 'open' ? 'bg-green-100 text-green-800' : 
              offering.status === 'closed' ? 'bg-red-100 text-red-800' : 
              offering.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {offering.status}
            </span>
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600">Course Code</p>
              <p className="text-lg font-semibold text-gray-900">{course?.code}</p>
            </div>
            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-sm text-gray-600">Credits (L-T-P)</p>
              <p className="text-lg font-semibold text-gray-900">{course?.ltp || 'N/A'}</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm text-gray-600">Academic Session</p>
              <p className="text-lg font-semibold text-gray-900">{offering.acad_session}</p>
            </div>
            <div className="border-l-4 border-orange-600 pl-4">
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-semibold text-gray-900">{offering.dept_name}</p>
            </div>
            <div className="border-l-4 border-indigo-600 pl-4">
              <p className="text-sm text-gray-600">Degree</p>
              <p className="text-lg font-semibold text-gray-900">{offering.degree || 'N/A'}</p>
            </div>
            <div className="border-l-4 border-red-600 pl-4">
              <p className="text-sm text-gray-600">Section</p>
              <p className="text-lg font-semibold text-gray-900">{offering.section || 'N/A'}</p>
            </div>
            <div className="border-l-4 border-cyan-600 pl-4">
              <p className="text-sm text-gray-600">Slot</p>
              <p className="text-lg font-semibold text-gray-900">{offering.slot || 'N/A'}</p>
            </div>
            <div className="border-l-4 border-teal-600 pl-4">
              <p className="text-sm text-gray-600">Instructor</p>
              <p className="text-lg font-semibold text-gray-900">
                {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'N/A'}
              </p>
            </div>
            <div className="border-l-4 border-pink-600 pl-4">
              <p className="text-sm text-gray-600">Instructor Email</p>
              <p className="text-lg font-semibold text-gray-900">{instructor?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Enrolled Students Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">Enrolled Students</h3>
            <span className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
              {enrolledStudents.length}
            </span>
          </div>

          {enrolledStudents.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
              <span>No students enrolled in this course yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Enrollment Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((enrollment, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{enrollment.student_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{enrollment.student_email || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {enrollment.enrol_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          enrollment.enrol_status === 'enrolled' ? 'bg-green-100 text-green-800' : 
                          enrollment.enrol_status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {enrollment.enrol_status}
                        </span>
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
  );
}

export default CourseDetailsPage;
