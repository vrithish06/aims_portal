import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import { X, Plus } from "lucide-react";

function CourseAddPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user); // session user

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preReqInput, setPreReqInput] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    ltp: "",
    status: "active",
    has_lab: false,
    pre_req: [],
  });

  // Authorization check
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error w-96">
          <span>Only admin can add courses.</span>
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
    const value = preReqInput.trim();
    if (!value) {
      setError("Please enter a course code");
      return;
    }
    if (formData.pre_req.includes(value)) {
      setError("Prerequisite already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pre_req: [...prev.pre_req, value],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.code || !formData.title) {
        setError("Course code and title are required");
        return;
      }

      const payload = {
        code: formData.code,
        title: formData.title,
        ltp: formData.ltp || null,
        status: formData.status,
        has_lab: formData.has_lab,
        pre_req: formData.pre_req,
      };

      console.log("[COURSE_ADD] Payload:", payload);

      const res = await axiosClient.post("/admin/add-course", payload);

      if (!res.data.success) {
        setError(res.data.message || "Failed to create course");
        return;
      }
      // display all courses after creation
      navigate("/courses/all", {
        state: { message: "Course created successfully!" },
      });
    } catch (err) {
      console.error("[COURSE_ADD] Error:", err);
      setError(err.response?.data?.message || err.message || "Something went wrong");
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

              {/* Course Code */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Course Code *</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              {/* Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Course Title *</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              {/* LTP */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">L-T-P</span>
                </label>
                <input
                  type="text"
                  name="ltp"
                  value={formData.ltp}
                  onChange={handleChange}
                  placeholder="e.g. 3-1-2"
                  className="input input-bordered"
                />
              </div>

              {/* Status */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select select-bordered"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Has Lab */}
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

              {/* Prerequisites */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Prerequisites</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={preReqInput}
                    onChange={(e) => setPreReqInput(e.target.value)}
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

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.pre_req.map((p, i) => (
                    <div key={i} className="badge badge-primary gap-2">
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePrerequisite(i)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
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
                  {isLoading ? "Creating..." : "Create Course"}
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
