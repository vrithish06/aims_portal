import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card'
import { Breadcrumb } from '../components/Breadcrumb'
import { Container, Layout, MainContent, Sidebar } from '../components/Layout'
import { BookOpen, Users, Calendar, User, Mail, Award } from 'lucide-react'

function StudentRecordPage() {
  const [studentInfo, setStudentInfo] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
      return
    }
    fetchStudentRecord()
  }, [isAuthenticated, user, navigate])

  const fetchStudentRecord = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch student details
      const studentRes = await fetch('http://localhost:3000/student/me', {
        credentials: 'include'
      })

      if (!studentRes.ok) {
        throw new Error('Failed to fetch student info')
      }

      const studentData = await studentRes.json()
      if (studentData.success) {
        setStudentInfo(studentData.data)
      }

      // Fetch enrolled courses
      const coursesRes = await fetch('http://localhost:3000/student/enrolled-courses', {
        credentials: 'include'
      })

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        if (coursesData.success) {
          setEnrolledCourses(coursesData.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching student record:', err)
      setError(err.message)
      setEnrolledCourses([])
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Student Record', current: true }
  ]

  const getGradeColor = (grade) => {
    if (!grade) return 'var(--neutral-500)'
    const gradeMap = {
      'A': 'var(--success-main)',
      'B': 'var(--primary-main)',
      'C': 'var(--warning-main)',
      'D': 'var(--danger-main)',
      'F': 'var(--danger-dark)'
    }
    return gradeMap[grade.charAt(0)] || 'var(--neutral-600)'
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'enrolled': return 'var(--primary-main)'
      case 'completed': return 'var(--success-main)'
      case 'dropped': return 'var(--danger-main)'
      default: return 'var(--neutral-500)'
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Layout>
      <Sidebar>
        <h3 style={{paddingBottom: 'var(--spacing-md)'}}>Menu</h3>
        <ul style={{listStyle: 'none', padding: 0}}>
          <li style={{marginBottom: 'var(--spacing-sm)'}}><a href="/">Dashboard</a></li>
          <li style={{marginBottom: 'var(--spacing-sm)'}}><a href="/enrolled-courses">My Courses</a></li>
          <li style={{marginBottom: 'var(--spacing-sm)'}}><a href="/course-offerings">Available Courses</a></li>
          <li style={{marginBottom: 'var(--spacing-sm)'}}><a href="/student-record" style={{color: 'var(--primary-main)', fontWeight: 600}}>Student Record</a></li>
        </ul>
      </Sidebar>
      <MainContent>
        <Container>
          <Breadcrumb items={breadcrumbItems} />
          
          <div style={{marginBottom: 'var(--spacing-lg)'}}>
            <h1 style={{fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)'}}>Student Record</h1>
            <p style={{color: 'var(--neutral-600)'}}>Complete academic record and course history</p>
          </div>

          {loading ? (
            <div style={{textAlign: 'center', padding: 'var(--spacing-xl)'}}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid var(--neutral-200)',
                borderTop: '4px solid var(--primary-main)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{marginTop: 'var(--spacing-md)', color: 'var(--neutral-600)'}}>Loading student record...</p>
            </div>
          ) : error ? (
            <Card>
              <CardBody>
                <div style={{textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--danger-main)'}}>
                  <p style={{fontSize: '1rem', fontWeight: 600}}>Error: {error}</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Student Details Section */}
              {studentInfo && (
                <Card style={{marginBottom: 'var(--spacing-lg)'}}>
                  <CardHeader>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <User size={24} style={{color: 'var(--primary-main)'}} />
                      <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0}}>Student Details</h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)'}}>
                      {/* Name */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 'var(--spacing-xs)'}}>Full Name</p>
                        <p style={{fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-900)'}}>
                          {studentInfo.users?.first_name} {studentInfo.users?.last_name}
                        </p>
                      </div>

                      {/* Email */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 'var(--spacing-xs)'}}>Email</p>
                        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                          <Mail size={16} style={{color: 'var(--primary-main)'}} />
                          <p style={{fontSize: '0.9rem', color: 'var(--neutral-900)'}}>
                            {studentInfo.users?.email || studentInfo.email || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Branch/Department */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 'var(--spacing-xs)'}}>Branch/Department</p>
                        <p style={{fontSize: '0.95rem', color: 'var(--neutral-900)'}}>{studentInfo.branch || 'Not Assigned'}</p>
                      </div>

                      {/* Degree */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 'var(--spacing-xs)'}}>Degree</p>
                        <p style={{fontSize: '0.95rem', color: 'var(--neutral-900)'}}>{studentInfo.degree || 'B.Tech'}</p>
                      </div>

                      {/* CGPA */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-main)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-700)', marginBottom: 'var(--spacing-xs)'}}>CGPA</p>
                        <p style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-main)'}}>
                          {studentInfo.cgpa?.toFixed(2) || '0.00'}
                        </p>
                      </div>

                      {/* Total Credits */}
                      <div style={{padding: 'var(--spacing-md)', background: 'var(--success-50)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--success-main)'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-700)', marginBottom: 'var(--spacing-xs)'}}>Total Credits Completed</p>
                        <p style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-main)'}}>
                          {studentInfo.total_credits_completed || 0}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Academic Record Section */}
              <Card>
                <CardHeader>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <BookOpen size={24} style={{color: 'var(--primary-main)'}} />
                    <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0}}>Course Records</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  {enrolledCourses.length === 0 ? (
                    <div style={{textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--neutral-600)'}}>
                      <p>No course records found</p>
                    </div>
                  ) : (
                    <div style={{overflowX: 'auto'}}>
                      <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                          <tr style={{borderBottom: '2px solid var(--neutral-200)'}}>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>S#</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Course Code</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Course Title</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Enrollment Type</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Status</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Grade</th>
                            <th style={{padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)'}}>Instructor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledCourses.map((enrollment, idx) => (
                            <tr key={enrollment.enrollment_id} style={{borderBottom: '1px solid var(--neutral-100)', transition: 'background 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--neutral-900)'}}>{idx + 1}</td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-main)'}}>
                                {enrollment.course_offering?.course?.code || 'N/A'}
                              </td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--neutral-900)'}}>
                                {enrollment.course_offering?.course?.title || 'N/A'}
                              </td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem'}}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  background: 'var(--neutral-100)',
                                  color: 'var(--neutral-700)',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}>
                                  {enrollment.enrol_type || 'Regular'}
                                </span>
                              </td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem'}}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  background: `${getStatusColor(enrollment.enrol_status)}20`,
                                  color: getStatusColor(enrollment.enrol_status),
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}>
                                  {enrollment.enrol_status || 'Unknown'}
                                </span>
                              </td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem', fontWeight: 600, color: getGradeColor(enrollment.grade)}}>
                                {enrollment.grade || '-'}
                              </td>
                              <td style={{padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--neutral-600)'}}>
                                {enrollment.course_offering?.instructor?.users?.first_name} {enrollment.course_offering?.instructor?.users?.last_name || 'TBA'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </Container>
      </MainContent>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  )
}

export default StudentRecordPage
