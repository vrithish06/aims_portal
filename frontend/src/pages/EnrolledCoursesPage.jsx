import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { BookOpen, Users } from 'lucide-react';

function EnrolledCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [enrollmentDetails, setEnrollmentDetails] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.user_id) {
      toast.error('Please login first');
      return;
    }
    fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/student/enrolled-courses');
      
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load enrolled courses');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCredits = () => {
    if (courses.length === 0) return { total: 0, completed: 0 };
    
    const enrolledCredits = courses
      .filter(c => c.enrol_status === 'enrolled')
      .reduce((sum, c) => {
        const credits = c.course_offering?.course?.ltp;
        return sum + (credits ? parseInt(credits.split('-')[0]) : 0);
      }, 0);
    
    const totalCredits = courses.reduce((sum, c) => {
      const credits = c.course_offering?.course?.ltp;
      return sum + (credits ? parseInt(credits.split('-')[0]) : 0);
    }, 0);

    return { total: totalCredits, completed: enrolledCredits };
  };

  const handleEnrollmentClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    // You can fetch more details here if needed
    setEnrollmentDetails({
      id: enrollment.id,
      status: enrollment.enrol_status,
      enrollmentDate: enrollment.created_at,
      grade: enrollment.grade
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const credits = calculateCredits();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <BookOpen className="w-8 h-8 text-blue-600" />
          My Enrolled Courses
        </h1>
        <p className="text-lg text-gray-600">
          Total enrolled: {courses.length} course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">

        {/* Credits Summary */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-gray-700 font-bold mb-2">Total Credits</h2>
              <p className="text-4xl font-bold text-blue-600">{credits.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-gray-700 font-bold mb-2">Active Credits</h2>
              <p className="text-4xl font-bold text-green-600">{credits.completed}</p>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
            <span>📚 You haven't enrolled in any courses yet. Visit the <strong>Available Courses</strong> page to enroll.</span>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {courses.map((enrollment) => {
              const course = enrollment.course_offering?.course;
              const offering = enrollment.course_offering;
              
              return (
                <div key={enrollment.id} className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:shadow-xl transition-all hover:border-blue-400" onClick={() => handleEnrollmentClick(enrollment)}>
                  <div className="mb-4">
                    <h2 className="text-2xl text-blue-700 font-bold">
                      {course?.code || 'N/A'}
                    </h2>
                    <p className="text-lg text-blue-600 font-semibold mt-1">{course?.title || 'Course'}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-6">
                    <p className="text-gray-800">
                      <span className="font-bold text-gray-900">CREDITS</span> <span className="text-gray-700 font-medium">{course?.ltp || 'N/A'}</span>. 
                      <span className="font-bold text-gray-900 ml-2">SESSION</span> <span className="text-gray-700 font-medium">{offering?.acad_session || 'N/A'}</span>.
                    </p>
                    <p className="text-gray-800">
                      <span className="font-bold text-gray-900">SECTION</span> <span className="text-gray-700 font-medium">{offering?.section || 'N/A'}</span>.
                    </p>
                    <p className="text-gray-800">
                      <span className="font-bold text-gray-900">SLOT</span> <span className="text-gray-700 font-medium">{offering?.slot || 'N/A'}</span>.
                    </p>
                    <p className="text-gray-800">
                      <span className="font-bold text-gray-900">ENROLLMENT TYPE</span> <span className="text-blue-600 font-semibold">{enrollment.enrol_type || 'N/A'}</span>.
                    </p>
                    <p className="text-gray-800">
                      <span className="font-bold text-gray-900">STATUS</span> 
                      <span className={`ml-1 font-bold px-2 py-0.5 rounded ${
                        enrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' : 
                        enrollment.enrol_status === 'completed' ? 'text-blue-600 bg-blue-100' : 
                        'text-yellow-600 bg-yellow-100'
                      }`}>
                        {enrollment.enrol_status ? enrollment.enrol_status.charAt(0).toUpperCase() + enrollment.enrol_status.slice(1) : 'Pending'}
                      </span>
                    </p>
                    {enrollment.grade && (
                      <p className="text-gray-800"><span className="font-bold text-gray-900">GRADE</span> <span className="text-gray-700 font-medium">{enrollment.grade}</span></p>
                    )}
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors" onClick={() => handleEnrollmentClick(enrollment)}>
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Modal for enrollment details */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-2xl p-8">
            <h3 className="font-bold text-2xl mb-6 text-gray-900 border-b-2 border-blue-200 pb-4">
              Enrollment Details - <span className="text-blue-600">{selectedEnrollment.course_offering?.course?.code}</span>
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Course Title</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEnrollment.course_offering?.course?.title}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                  <span className={`font-bold px-3 py-1 rounded ${
                    selectedEnrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' : 
                    selectedEnrollment.enrol_status === 'completed' ? 'text-blue-600 bg-blue-100' : 
                    'text-yellow-600 bg-yellow-100'
                  }`}>
                    {selectedEnrollment.enrol_status ? selectedEnrollment.enrol_status.charAt(0).toUpperCase() + selectedEnrollment.enrol_status.slice(1) : 'Pending'}
                  </span>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Credits</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEnrollment.course_offering?.course?.ltp}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Grade</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEnrollment.grade || 'Not Graded'}</p>
                </div>
              </div>

              <div className="border-t-2 border-blue-200 pt-6">
                <p className="text-lg font-bold text-gray-900 mb-4">Course Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="text-gray-700"><span className="font-bold text-gray-900">Department:</span> <span className="font-medium">{selectedEnrollment.course_offering?.dept_name}</span></p>
                  <p className="text-gray-700"><span className="font-bold text-gray-900">Session:</span> <span className="font-medium">{selectedEnrollment.course_offering?.acad_session}</span></p>
                  <p className="text-gray-700"><span className="font-bold text-gray-900">Section:</span> <span className="font-medium">{selectedEnrollment.course_offering?.section}</span></p>
                  <p className="text-gray-700"><span className="font-bold text-gray-900">Slot:</span> <span className="font-medium">{selectedEnrollment.course_offering?.slot}</span></p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors" onClick={() => setSelectedEnrollment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrolledCoursesPage;
