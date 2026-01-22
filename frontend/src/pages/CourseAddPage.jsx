import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { X, Plus } from "lucide-react";

function CourseAddPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preReqInput, setPreReqInput] = useState("");

  const [formData, setFormData] = useState({
    // Course fields
    code: "",
    title: "",
    ltp: "",
    status: "active",
    has_lab: false,
    pre_req: [],

    // Course Offering fields
    degree: "",
    dept_name: "",
    acad_session: "",
    offering_status: "Proposed",
    slot: "",
    section: "",
    is_coordinator: false,
  });

  // Check authorization
  if (user?.role !== "instructor" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error w-96">
          <span>You do not have permission to add courses. Only instructors and admins can add courses.</span>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddPrerequisite = () => {
    if (preReqInput.trim() === "") {
      setError("Please enter a course code");
      return;
    }

    if (formData.pre_req.includes(preReqInput.trim())) {
      setError("This prerequisite is already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pre_req: [...prev.pre_req, preReqInput.trim()],
    }));
    setPreReqInput("");
    setError("");
  };

  const handleRemovePrerequisite = (index) => {
    setFormData((prev) => ({
      ...prev,
      pre_req: prev.pre_req.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPrerequisite();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.code || !formData.title) {
        setError("Course code and title are required");
        setIsLoading(false);
        return;
      }

      if (!formData.degree || !formData.dept_name || !formData.acad_session) {
        setError("Degree, Department, and Academic Session are required for the offering");
        setIsLoading(false);
        return;
      }

      console.log("[COURSE_ADD] Submitting course with data:", formData);

      // Step 1: Create the course
      const courseResponse = await axiosClient.post("/instructor/course", {
        code: formData.code,
        title: formData.title,
        ltp: formData.ltp || null,
        status: formData.status,
        has_lab: formData.has_lab,
        pre_req: formData.pre_req,
      });

      if (!courseResponse.data.success) {
        setError(courseResponse.data.message || "Failed to create course");
        setIsLoading(false);
        return;
      }

      const courseId = courseResponse.data.data.course_id;
      console.log("[COURSE_ADD] Course created successfully with ID:", courseId);

      // Step 2: Create the course offering
      const offeringResponse = await axiosClient.post(
        `/course/${courseId}/offer`,
        {
          degree: formData.degree,
          dept_name: formData.dept_name,
          acad_session: formData.acad_session,
          status: formData.offering_status,
          slot: formData.slot || null,
          section: formData.section || null,
          is_coordinator: formData.is_coordinator,
        }
      );

      if (!offeringResponse.data.success) {
        setError(offeringResponse.data.message || "Failed to create course offering");
        setIsLoading(false);
        return;
      }

      console.log("[COURSE_ADD] Course offering created successfully");

      // Success - redirect to course offerings page
      navigate("/course-offerings", {
        state: { message: "Course and offering created successfully!" },
      });
    } catch (err) {
      console.error("[COURSE_ADD] Error:", err);
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card bg-white shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-6">Add New Course</h1>

            {error && (
              <div className="alert alert-error mb-6">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* COURSE DETAILS SECTION */}
              <div className="divider">Course Details</div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Course Code *</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., CS101"
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Course Title *</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Computer Science"
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">L-T-P</span>
                </label>
                <input
                  type="text"
                  name="ltp"
                  value={formData.ltp}
                  onChange={handleChange}
                  placeholder="e.g., 3-1-2"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Has Lab</span>
                  <input
                    type="checkbox"
                    name="has_lab"
                    checked={formData.has_lab}
                    onChange={handleChange}
                    className="checkbox"
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Prerequisites</span>
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={preReqInput}
                      onChange={(e) => setPreReqInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., CS100"
                      className="input input-bordered flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddPrerequisite}
                      className="btn btn-outline btn-sm gap-2"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>

                  {formData.pre_req.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.pre_req.map((prereq, index) => (
                        <div
                          key={index}
                          className="badge badge-lg badge-primary gap-2 py-3 px-3"
                        >
                          {prereq}
                          <button
                            type="button"
                            onClick={() => handleRemovePrerequisite(index)}
                            className="hover:bg-error hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.pre_req.length === 0 && (
                    <p className="text-sm text-gray-500">No prerequisites added</p>
                  )}
                </div>
              </div>

              {/* COURSE OFFERING SECTION */}
              <div className="divider">Course Offering Details</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Degree *</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech"
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Department *</span>
                  </label>
                  <input
                    type="text"
                    name="dept_name"
                    value={formData.dept_name}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Academic Session *</span>
                </label>
                <input
                  type="text"
                  name="acad_session"
                  value={formData.acad_session}
                  onChange={handleChange}
                  placeholder="e.g., 2024-1 or Fall-2024"
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Slot</span>
                  </label>
                  <input
                    type="text"
                    name="slot"
                    value={formData.slot}
                    onChange={handleChange}
                    placeholder="e.g., A1"
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Section</span>
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g., A"
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Is Coordinator</span>
                  <input
                    type="checkbox"
                    name="is_coordinator"
                    checked={formData.is_coordinator}
                    onChange={handleChange}
                    className="checkbox"
                  />
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="card-actions justify-between mt-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                >
                  {isLoading ? "Creating..." : "Create Course & Offering"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseAddPage;
