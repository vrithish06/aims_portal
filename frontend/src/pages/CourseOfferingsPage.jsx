import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Zap, Users } from 'lucide-react';

function CourseOfferingsPage() {
  const [offerings, setOfferings] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [enrollmentStats, setEnrollmentStats] = useState({});
  const [enrolledStudents, setEnrolledStudents] = useState({});
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchCourseOfferings();
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:3000/course-offerings'
      );
      
      if (response.data.success) {
        setOfferings(response.data.data);
        // Fetch enrollment stats for each offering
        response.data.data.forEach(offering => {
          fetchEnrollmentStats(offering.offering_id);
        });
      }
    } catch (error) {
      toast.error('Failed to load course offerings');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentStats = async (offeringId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/offering/${offeringId}/enrollments`
      );
      
      if (response.data.success) {
        setEnrollmentStats(prev => ({
          ...prev,
          [offeringId]: response.data.count
        }));
        setEnrolledStudents(prev => ({
          ...prev,
          [offeringId]: response.data.data || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch enrollment stats:', error);
      setEnrollmentStats(prev => ({
        ...prev,
        [offeringId]: 0
      }));
    }
  };

  const handleEnroll = async (offeringId) => {
    if (!user?.user_id) {
      toast.error('Please login first');
      return;
    }

    try {
      setEnrolling(offeringId);
      const response = await axios.post(
        `http://localhost:3000/student/${user.user_id}/${offeringId}/enroll`,
        {
          enrol_type: 'regular',
          enrol_status: 'enrolled'
        }
      );

      if (response.data.success) {
        toast.success('Successfully enrolled in course!');
        
        // Wait a moment for the enrollment to be saved
        setTimeout(async () => {
          // Refresh enrollment stats for this offering
          await fetchEnrollmentStats(offeringId);
          
          // Open the modal to show all enrollments
          setSelectedOffering(offeringId);
          
          // Also refresh the full course offerings list
          await fetchCourseOfferings();
        }, 300);
      } else {
        toast.error('Enrollment failed');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You are already enrolled in this course');
      } else {
        toast.error(error.response?.data?.message || 'Failed to enroll');
      }
      console.error('Enrollment error:', error);
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Zap className="w-8 h-8" />
            Available Course Offerings
          </h1>
          <p className="text-lg text-gray-600">
            Total offerings: {offerings.length}
          </p>
        </div>

        {offerings.length === 0 ? (
          <div className="alert alert-info">
            <span>No course offerings available at the moment.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => {
              const course = offering.course;
              const instructor = offering.instructor?.users;
              const enrollmentCount = enrollmentStats[offering.offering_id] || 0;
              
              return (
                <div key={offering.offering_id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition">
                  <div className="card-body">
                    <h2 className="card-title text-lg">
                      {course?.code || 'N/A'}
                    </h2>
                    <p className="font-semibold text-base mb-3">
                      {course?.title || 'Course'}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Credits:</span> {course?.ltp || 'N/A'}</p>
                      <p><span className="font-semibold">Instructor:</span> {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'N/A'}</p>
                      <p><span className="font-semibold">Session:</span> {offering.acad_session || 'N/A'}</p>
                      <p><span className="font-semibold">Department:</span> {offering.dept_name || 'N/A'}</p>
                      <p><span className="font-semibold">Degree:</span> {offering.degree || 'N/A'}</p>
                      <p><span className="font-semibold">Section:</span> {offering.section || 'N/A'}</p>
                      <p><span className="font-semibold">Slot:</span> {offering.slot || 'N/A'}</p>
                      <p>
                        <span className="font-semibold">Status:</span>
                        <span className={`ml-2 badge ${
                          offering.status === 'open' ? 'badge-success' : offering.status === 'closed' ? 'badge-error' : offering.status === 'ongoing' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {offering.status || 'unknown'}
                        </span>
                      </p>

                      {/* Enrollment count badge - only show if there are enrollments */}
                      {enrollmentCount > 0 && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">
                            <span className="font-semibold">{enrollmentCount}</span> students enrolled
                          </span>
                          <button
                            className="ml-auto btn btn-xs btn-ghost"
                            onClick={() => {
                              setSelectedOffering(offering.id);
                            }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-between mt-4">
                      {enrollmentCount > 0 && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setSelectedOffering(offering.offering_id);
                          }}
                        >
                          View Enrollments ({enrollmentCount})
                        </button>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEnroll(offering.offering_id)}
                        disabled={enrolling === offering.offering_id}
                      >
                        {enrolling === offering.offering_id ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Now'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for enrolled students */}
      {selectedOffering && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrolled Students - {offerings.find(o => o.offering_id === selectedOffering)?.course?.code}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Total Enrolled: <span className="badge badge-lg badge-primary">{enrollmentStats[selectedOffering] || 0}</span>
              </p>
            </div>

            {enrolledStudents[selectedOffering]?.length === 0 ? (
              <div className="alert alert-info">
                <span>No students enrolled yet in this course.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents[selectedOffering]?.map((enrollment, idx) => (
                      <tr key={idx}>
                        <td>{enrollment.student_name || 'N/A'}</td>
                        <td>{enrollment.student_email || 'N/A'}</td>
                        <td>
                          <span className={`badge ${
                            enrollment.enrol_status === 'enrolled' ? 'badge-success' : enrollment.enrol_status === 'completed' ? 'badge-info' : 'badge-warning'
                          }`}>
                            {enrollment.enrol_status}
                          </span>
                        </td>
                        <td>{enrollment.grade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedOffering(null)}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedOffering(null)}></div>
        </div>
      )}
    </div>
  );
}

export default CourseOfferingsPage;
