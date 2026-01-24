import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { Search, ArrowLeft, Plus, X, Check } from "lucide-react";

function AddOfferingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Form states
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseSearchResults, setCourseSearchResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [acad_session, setAcadSession] = useState("");
  const [status, setStatus] = useState("Proposed");
  const [slot, setSlot] = useState("");
  const [section, setSection] = useState("");

  // Instructors
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [instructorSearch, setInstructorSearch] = useState("");
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);

  // Targets
  const [targets, setTargets] = useState([
    { batch: "", degree: "", branch: "", offering_type: [] }
  ]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchRef = useRef(null);
  const instructorRef = useRef(null);

  const offeringTypeOptions = [
    "Core",
    "Program Elective",
    "Open Elective"
  ];

  const handleTargetChange = (index, field, value) => {
    setTargets(prev =>
      prev.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      )
    );
  };

  const toggleOfferingType = (index, type) => {
    setTargets(prev =>
      prev.map((t, i) =>
        i === index
          ? {
            ...t,
            offering_type: t.offering_type.includes(type)
              ? t.offering_type.filter(v => v !== type)
              : [...t.offering_type, type]
          }
          : t
      )
    );
  };

  const addTarget = () => {
    setTargets([
      ...targets,
      { batch: "", degree: "", branch: "", offering_type: [] }
    ]);
  };

  const removeTarget = (index) => {
    setTargets(targets.filter((_, i) => i !== index));
  };


  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (instructorRef.current && !instructorRef.current.contains(e.target)) {
        setShowInstructorDropdown(false);
      }
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Fetch available instructors on mount
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/instructors/all");
        if (response.data.success) {
          setAvailableInstructors(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch instructors:", error);
        toast.error("Failed to load instructors");
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  // Search courses
  const handleCourseSearch = async (query) => {
    setCourseSearchQuery(query);

    if (query.trim() === "") {
      setCourseSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await axiosClient.get("/courses/search", {
        params: { code: query }
      });

      if (response.data.success) {
        setCourseSearchResults(response.data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setCourseSearchResults([]);
    }
  };

  // Select course
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCourseSearchQuery("");
    setShowSearchResults(false);
    setCourseSearchResults([]);
  };

  // Add instructor
  const handleAddInstructor = (instructor) => {
    // Check if already added
    if (selectedInstructors.some((i) => i.instructor_id === instructor.instructor_id)) {
      toast.error("Instructor already added");
      return;
    }

    setSelectedInstructors([
      ...selectedInstructors,
      {
        instructor_id: instructor.instructor_id,
        user_id: instructor.user_id,
        name: `${instructor.users?.first_name || ""} ${instructor.users?.last_name || ""}`,
        email: instructor.users?.email || "",
        is_coordinator: false
      }
    ]);

    setInstructorSearch("");
    setShowInstructorDropdown(false);
  };

  // Remove instructor
  const handleRemoveInstructor = (instructorId) => {
    setSelectedInstructors(
      selectedInstructors.filter((i) => i.instructor_id !== instructorId)
    );
  };

  // Toggle coordinator status
  const handleToggleCoordinator = (instructorId) => {
    setSelectedInstructors(
      selectedInstructors.map((i) => {
        if (i.instructor_id === instructorId) {
          return { ...i, is_coordinator: !i.is_coordinator };
        } else {
          // Ensure only one coordinator
          return { ...i, is_coordinator: false };
        }
      })
    );
  };

  const filteredInstructors = availableInstructors.filter((instr) => {
    // Exclude already selected instructors
    if (
      selectedInstructors.some(
        (s) => s.instructor_id === instr.instructor_id
      )
    ) {
      return false;
    }

    const fullName = `${instr.users?.first_name || ""} ${instr.users?.last_name || ""
      }`.toLowerCase();

    const email = instr.users?.email?.toLowerCase() || "";
    const query = instructorSearch.toLowerCase();

    // If search is empty, show all remaining instructors
    if (!query) return true;

    return fullName.includes(query) || email.includes(query);
  });


  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    if (!acad_session.trim()) {
      toast.error("Academic session is required");
      return;
    }

    if (selectedInstructors.length === 0) {
      toast.error("Please add at least one instructor");
      return;
    }

    const coordinators = selectedInstructors.filter((i) => i.is_coordinator);
    if (coordinators.length !== 1) {
      toast.error("Exactly one instructor must be marked as coordinator");
      return;
    }

    try {
      setSubmitting(true);

      const response = await axiosClient.post(
        "/offering/create-with-instructors",
        {
          course_id: selectedCourse.course_id,
          acad_session,
          status,
          slot: slot || null,
          section: section || null,
          targets, // ✅ ADD THIS
          instructors: selectedInstructors.map(i => ({
            instructor_id: i.instructor_id,
            is_coordinator: i.is_coordinator
          }))
        }
      );


      if (response.data.success) {
        toast.success("Course offering created successfully!");
        // Reset form
        setSelectedCourse(null);
        setAcadSession("");
        setStatus("Enrolling");
        setSlot("");
        setSection("");
        setSelectedInstructors([]);
        setCourseSearchQuery("");

        // Navigate after short delay
        setTimeout(() => navigate("/my-offerings"), 1500);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error.response?.data?.message || "Failed to create course offering"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Course Offering
          </h1>
          <p className="text-gray-600 mb-6">
            Add a new course offering with instructors
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Code
              </label>
              {!selectedCourse ? (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={courseSearchQuery}
                      onChange={(e) => handleCourseSearch(e.target.value)}
                      onFocus={() => courseSearchQuery && setShowSearchResults(true)}
                      placeholder="Search course code..."
                      className="input input-bordered w-full pl-10"
                    />
                  </div>

                  {showSearchResults && courseSearchResults.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                      {courseSearchResults.map((course) => (
                        <button
                          key={course.course_id}
                          type="button"
                          onClick={() => handleSelectCourse(course)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                        >
                          <div className="font-semibold text-gray-900">
                            {course.code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {course.title}
                          </div>
                          {course.ltp && (
                            <div className="text-xs text-gray-500 mt-1">
                              L-T-P: {course.ltp}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {showSearchResults &&
                    courseSearchQuery &&
                    courseSearchResults.length === 0 && (
                      <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-500 text-sm z-50">
                        No courses found matching "{courseSearchQuery}"
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedCourse.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedCourse.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Academic Session */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Session *
              </label>
              <input
                type="text"
                value={acad_session}
                onChange={(e) => setAcadSession(e.target.value)}
                placeholder="e.g., 2026-I , 2026-II"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="Proposed">Proposed</option>
              </select>
            </div>

            {/* Slot and Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slot
                </label>
                <input
                  type="text"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  placeholder="e.g., A1"
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 1, 2, A"
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            {/* Instructors */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructors * (Min 1 required)
              </label>

              {/* Add Instructor Dropdown */}
              <div ref={instructorRef} className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={instructorSearch}
                    onChange={(e) => setInstructorSearch(e.target.value)}
                    onFocus={() => setShowInstructorDropdown(true)}
                    placeholder="Search and add instructor..."
                    className="input input-bordered w-full pl-10"
                    disabled={loading}
                  />
                </div>

                {showInstructorDropdown && !loading && (
                  <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                    {filteredInstructors.length > 0 ? (
                      filteredInstructors.map((instructor) => (
                        <button
                          key={instructor.instructor_id}
                          type="button"
                          onClick={() => handleAddInstructor(instructor)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {instructor.users?.first_name}{" "}
                              {instructor.users?.last_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {instructor.users?.email}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No instructors available or all already added
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Instructors */}
              <div className="space-y-2">
                {selectedInstructors.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    No instructors added yet
                  </div>
                ) : (
                  selectedInstructors.map((instructor) => (
                    <div
                      key={instructor.instructor_id}
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {instructor.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {instructor.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Coordinator Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleCoordinator(instructor.instructor_id)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition ${instructor.is_coordinator
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {instructor.is_coordinator ? (
                            <>
                              <Check className="w-3 h-3" />
                              Coordinator
                            </>
                          ) : (
                            "Not Coordinator"
                          )}
                        </button>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveInstructor(instructor.instructor_id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {selectedInstructors.filter((i) => i.is_coordinator).length > 0 && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-xs font-medium">
                    <Check className="inline w-3 h-3 mr-1" />
                    One coordinator assigned
                  </div>
                )}
              </div>
            </div>

            {/* Targets */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Targets (Batch / Degree / Branch / Type)
              </label>

              <div className="space-y-4">
                {targets.map((target, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Batch (e.g. 2024)"
                        value={target.batch}
                        onChange={(e) =>
                          handleTargetChange(idx, "batch", Number(e.target.value))
                        }
                        className="input input-bordered"
                      />

                      <input
                        type="text"
                        placeholder="Degree (BTech / MTech)"
                        value={target.degree}
                        onChange={(e) =>
                          handleTargetChange(idx, "degree", e.target.value)
                        }
                        className="input input-bordered"
                      />

                      <input
                        type="text"
                        placeholder="Branch (CSE / EE)"
                        value={target.branch}
                        onChange={(e) =>
                          handleTargetChange(idx, "branch", e.target.value)
                        }
                        className="input input-bordered"
                      />
                    </div>

                    {/* Offering Type */}
                    <div className="flex gap-2 flex-wrap">
                      {offeringTypeOptions.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleOfferingType(idx, type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${target.offering_type.includes(type)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300"
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTarget(idx)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove target
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTarget}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                + Add another target
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || !selectedCourse || selectedInstructors.length === 0}
                className="btn btn-primary flex-1"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  "Create Course Offering"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddOfferingPage;
