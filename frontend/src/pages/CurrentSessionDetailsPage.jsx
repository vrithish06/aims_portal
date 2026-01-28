import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { Download, CheckCircle, AlertCircle, Loader } from "lucide-react";
import * as XLSX from 'xlsx';

export default function CurrentSessionDetailsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOfferings, setSelectedOfferings] = useState(new Set());
  const [newStatus, setNewStatus] = useState("Enrolling");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionTab, setActionTab] = useState("bulk-status"); // bulk-status, cgpa, grades

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchSessions();
  }, [isAuthenticated, user, navigate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/session/list');
      const uniqueSessions = [...new Set(response.data.data)].sort().reverse();
      setSessions(uniqueSessions);
      if (uniqueSessions.length > 0) {
        setSelectedSession(uniqueSessions[0]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setErrorMessage("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOfferingsBySession = async (session) => {
    if (!session) return;

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axiosClient.get(`/session/${session}/offerings`);
      setCourseOfferings(response.data.data || []);
      setSelectedOfferings(new Set());
    } catch (err) {
      console.error("Error fetching course offerings:", err);
      setErrorMessage("Failed to fetch course offerings for this session");
      setCourseOfferings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (e) => {
    const session = e.target.value;
    setSelectedSession(session);
    fetchCourseOfferingsBySession(session);
  };

  const handleOfferingToggle = (offeringId) => {
    const newSet = new Set(selectedOfferings);
    if (newSet.has(offeringId)) {
      newSet.delete(offeringId);
    } else {
      newSet.add(offeringId);
    }
    setSelectedOfferings(newSet);
  };

  const handleSelectAllOfferings = () => {
    if (selectedOfferings.size === courseOfferings.length) {
      setSelectedOfferings(new Set());
    } else {
      setSelectedOfferings(new Set(courseOfferings.map(o => o.offering_id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedOfferings.size === 0) {
      setErrorMessage("Please select at least one course offering");
      return;
    }

    if (!window.confirm(`Are you sure you want to update the status of ${selectedOfferings.size} offering(s) to ${newStatus}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const offeringIds = Array.from(selectedOfferings);
      const response = await axiosClient.post('/session/bulk-update-offering-status', {
        offering_ids: offeringIds,
        new_status: newStatus
      });

      setSuccessMessage(`Successfully updated ${offeringIds.length} course offering(s) to ${newStatus}`);
      setSelectedOfferings(new Set());
      await fetchCourseOfferingsBySession(selectedSession);
    } catch (err) {
      console.error("Error updating offering status:", err);
      setErrorMessage(err.response?.data?.message || "Failed to update course offering status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCalculateCGPA = async () => {
    if (!selectedSession) {
      setErrorMessage("Please select a session");
      return;
    }

    if (!window.confirm(`Are you sure you want to calculate CGPA for session ${selectedSession}? This may take a while.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axiosClient.post('/session/calculate-cgpa', {
        session: selectedSession
      });

      setSuccessMessage(`CGPA calculated successfully for session ${selectedSession}. Affected students: ${response.data.data?.affected_students || 0}`);
    } catch (err) {
      console.error("Error calculating CGPA:", err);
      setErrorMessage(err.response?.data?.message || "Failed to calculate CGPA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadGradeSheets = async () => {
    if (selectedOfferings.size === 0) {
      setErrorMessage("Please select at least one course offering");
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const offeringIds = Array.from(selectedOfferings);
      const response = await axiosClient.post('/session/download-grade-sheets', {
        offering_ids: offeringIds
      });

      // Generate Excel file from response data
      if (response.data.data && Object.keys(response.data.data).length > 0) {
        const workbook = XLSX.utils.book_new();

        // Create a sheet for each offering
        Object.entries(response.data.data).forEach(([offeringId, offeringData]) => {
          const sheetData = [
            ["Course Code", offeringData.course_code],
            ["Course Title", offeringData.course_title],
            ["Session", offeringData.session],
            [],
            ["Student Email", "Student Name", "Enrollment Type", "Enrollment Status", "Grade"]
          ];

          // Add enrollment data
          offeringData.enrollments.forEach(enrollment => {
            sheetData.push([
              enrollment.student_email,
              enrollment.student_name,
              enrollment.enrol_type,
              enrollment.enrol_status,
              enrollment.grade
            ]);
          });

          const worksheetName = `${offeringData.course_code}`.substring(0, 31); // Excel sheet name limit
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        });

        // Generate and download Excel file
        const fileName = `grade_sheets_${selectedSession}_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        setSuccessMessage("Grade sheets downloaded successfully");
        setSelectedOfferings(new Set());
      } else {
        setErrorMessage("No enrollments found to download");
      }
    } catch (err) {
      console.error("Error downloading grade sheets:", err);
      setErrorMessage(err.response?.data?.message || "Failed to download grade sheets");
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = ["Enrolling", "Running", "Completed", "Canceled"];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Session Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-8 w-fit border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Academic Session
          </label>
          <select
            value={selectedSession}
            onChange={handleSessionChange}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Choose a session --</option>
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Tabs */}
        {selectedSession && (
          <>
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActionTab("bulk-status")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${actionTab === "bulk-status"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                Bulk Update Status
              </button>
              <button
                onClick={() => setActionTab("cgpa")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${actionTab === "cgpa"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                Calculate CGPA
              </button>
              <button
                onClick={() => setActionTab("grades")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${actionTab === "grades"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                Download Grade Sheets
              </button>
            </div>

            {/* Tab Content */}
            {actionTab === "bulk-status" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course Offerings List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Course Offerings ({courseOfferings.length})
                  </h2>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : courseOfferings.length === 0 ? (
                    <p className="text-gray-500 py-8 text-center">No course offerings found for this session</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedOfferings.size === courseOfferings.length && courseOfferings.length > 0}
                          onChange={handleSelectAllOfferings}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Select All ({selectedOfferings.size}/{courseOfferings.length})
                        </label>
                      </div>

                      {courseOfferings.map((offering) => (
                        <div
                          key={offering.offering_id}
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border border-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOfferings.has(offering.offering_id)}
                            onChange={() => handleOfferingToggle(offering.offering_id)}
                            className="w-4 h-4 text-blue-600 rounded mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {offering.course?.code} - {offering.course?.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: <span className="font-semibold">{offering.status}</span>
                              {offering.section && ` | Section: ${offering.section}`}
                              {offering.slot && ` | Slot: ${offering.slot}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              Enrollments: {offering._count?.enrollments || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bulk Status Update Panel */}
                <div className="bg-white rounded-lg shadow p-6 h-fit">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> {selectedOfferings.size} offering(s)
                      </p>
                    </div>

                    <button
                      onClick={handleBulkStatusChange}
                      disabled={selectedOfferings.size === 0 || actionLoading}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${selectedOfferings.size === 0 || actionLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      {actionLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Update Status"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionTab === "cgpa" && (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="max-w-2xl mx-auto text-center py-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Calculate CGPA</h2>
                  <p className="text-gray-600 mb-6">
                    This will calculate and update CGPA for all students with enrolled courses in the selected session.
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    Session: <span className="font-semibold text-gray-900">{selectedSession}</span>
                  </p>

                  <button
                    onClick={handleCalculateCGPA}
                    disabled={actionLoading}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${actionLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Calculate CGPA
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {actionTab === "grades" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course Offerings List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Course Offerings ({courseOfferings.length})
                  </h2>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : courseOfferings.length === 0 ? (
                    <p className="text-gray-500 py-8 text-center">No course offerings found for this session</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedOfferings.size === courseOfferings.length && courseOfferings.length > 0}
                          onChange={handleSelectAllOfferings}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Select All ({selectedOfferings.size}/{courseOfferings.length})
                        </label>
                      </div>

                      {courseOfferings.map((offering) => (
                        <div
                          key={offering.offering_id}
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border border-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOfferings.has(offering.offering_id)}
                            onChange={() => handleOfferingToggle(offering.offering_id)}
                            className="w-4 h-4 text-blue-600 rounded mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {offering.course?.code} - {offering.course?.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: <span className="font-semibold">{offering.status}</span>
                              {offering.section && ` | Section: ${offering.section}`}
                              {offering.slot && ` | Slot: ${offering.slot}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              Enrollments: {offering._count?.enrollments || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Panel */}
                <div className="bg-white rounded-lg shadow p-6 h-fit">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Sheets</h2>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> {selectedOfferings.size} offering(s)
                      </p>
                    </div>

                    <p className="text-sm text-gray-600">
                      Download grade sheets as Excel file for selected course offerings.
                    </p>

                    <button
                      onClick={handleDownloadGradeSheets}
                      disabled={selectedOfferings.size === 0 || actionLoading}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${selectedOfferings.size === 0 || actionLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                    >
                      {actionLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Sheets
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
