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
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            My Enrolled Courses
          </h1>
          <p className="text-lg text-gray-600">
            Total enrolled: {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Credits Summary */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card bg-primary text-primary-content shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Total Credits</h2>
                <p className="text-4xl font-bold">{credits.total}</p>
              </div>
            </div>
            <div className="card bg-success text-success-content shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Active Credits</h2>
                <p className="text-4xl font-bold">{credits.completed}</p>
              </div>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="alert alert-info">
            <span>📚 You haven't enrolled in any courses yet. Visit the <strong>Available Courses</strong> page to enroll.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((enrollment) => {
              const course = enrollment.course_offering?.course;
              const offering = enrollment.course_offering;
              
              return (
                <div key={enrollment.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition cursor-pointer" onClick={() => handleEnrollmentClick(enrollment)}>
                  <div className="card-body">
                    <h2 className="card-title text-lg">
                      {course?.code || 'N/A'}
                    </h2>
                    <p className="font-semibold">{course?.title || 'Course'}</p>
                    
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Credits:</span> {course?.ltp || 'N/A'}</p>
                      <p><span className="font-semibold">Session:</span> {offering?.acad_session || 'N/A'}</p>
                      <p><span className="font-semibold">Section:</span> {offering?.section || 'N/A'}</p>
                      <p><span className="font-semibold">Slot:</span> {offering?.slot || 'N/A'}</p>
                      <p>
                        <span className="font-semibold">Status:</span> 
                        <span className={`ml-2 badge ${
                          enrollment.enrol_status === 'enrolled' ? 'badge-success' : enrollment.enrol_status === 'completed' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {enrollment.enrol_status || 'pending'}
                        </span>
                      </p>
                      {enrollment.grade && (
                        <p><span className="font-semibold">Grade:</span> <span className="badge badge-lg">{enrollment.grade}</span></p>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button className="btn btn-sm btn-outline" onClick={() => handleEnrollmentClick(enrollment)}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for enrollment details */}
      {selectedEnrollment && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Enrollment Details - {selectedEnrollment.course_offering?.course?.code}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Course Title</p>
                  <p className="text-lg">{selectedEnrollment.course_offering?.course?.title}</p>
                </div>
                <div>
                  <p>
                    <span className="font-semibold">Status</span>
                    <span className={`badge badge-lg ml-2 ${
                      selectedEnrollment.enrol_status === 'enrolled' ? 'badge-success' : selectedEnrollment.enrol_status === 'completed' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {selectedEnrollment.enrol_status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Credits</p>
                  <p className="text-lg">{selectedEnrollment.course_offering?.course?.ltp}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Grade</p>
                  <p className="text-lg">{selectedEnrollment.grade || 'Not Graded'}</p>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Course Details</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Department:</span> {selectedEnrollment.course_offering?.dept_name}</p>
                  <p><span className="font-semibold">Session:</span> {selectedEnrollment.course_offering?.acad_session}</p>
                  <p><span className="font-semibold">Section:</span> {selectedEnrollment.course_offering?.section}</p>
                  <p><span className="font-semibold">Slot:</span> {selectedEnrollment.course_offering?.slot}</p>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedEnrollment(null)}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedEnrollment(null)}></div>
        </div>
      )}
    </div>
  );
}

export default EnrolledCoursesPage;
