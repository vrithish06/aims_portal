import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import { Users, Plus, Search, Filter } from "lucide-react";

function AddAdvisorPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [filterBranch, setFilterBranch] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    forDegree: "BTech",
    batch: new Date().getFullYear(),
  });

  const branches = ["all", "CSE", "EE", "MNC", "MECH", "CHE", "CIVIL", "AI"];
  const degrees = ["BTech", "MTech", "PhD"];

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchInstructors();
  }, [isAuthenticated, user, navigate]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/instructors/all");

      console.log("[AddAdvisor] API Response:", res.data);
      
      if (res.data.success) {
        const instructorsData = res.data.data || [];
        console.log("[AddAdvisor] Instructors data:", instructorsData);
        console.log("[AddAdvisor] Count:", instructorsData.length);
        setInstructors(instructorsData);
      } else {
        setError("Failed to fetch instructors");
      }
    } catch (err) {
      console.error("Fetch instructors error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdvisor = async (e) => {
    e.preventDefault();

    if (!selectedInstructor) {
      toast.error("Please select an instructor");
      return;
    }

    if (!formData.forDegree || !formData.batch) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        instructor_id: selectedInstructor.instructor_id,
        for_degree: formData.forDegree,
        batch: formData.batch,
      };
      console.log("[AddAdvisor] Sending payload:", payload);
      
      const res = await axiosClient.post("/admin/add-advisor", payload);

      if (res.data.success) {
        toast.success("Advisor added successfully!");
        setSelectedInstructor(null);
        setFormData({
          forDegree: "BTech",
          batch: new Date().getFullYear(),
        });
        // Navigate to all advisors page after 1 second
        setTimeout(() => {
          navigate("/all-advisors", {
            state: { successMessage: "Advisor added successfully" },
          });
        }, 1000);
      } else {
        toast.error(res.data.message || "Failed to add advisor");
      }
    } catch (err) {
      console.error("Add advisor error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesBranch =
      filterBranch === "all" || instructor.branch === filterBranch;
    const matchesSearch =
      instructor.users?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      instructor.users?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      instructor.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBranch && matchesSearch;
  });

  console.log("[AddAdvisor] Instructors:", instructors);
  console.log("[AddAdvisor] Filter branch:", filterBranch);
  console.log("[AddAdvisor] Search term:", searchTerm);
  console.log("[AddAdvisor] Filtered instructors:", filteredInstructors);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Add New Advisor
          </h1>
          <p className="text-gray-600">
            Assign instructors as faculty advisors for specific degrees and
            batches
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="mt-4 text-gray-600">Loading instructors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instructors List Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Select Instructor
                </h2>

                {/* Filters */}
                <div className="mb-6 space-y-4 sm:space-y-0 sm:flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Filter className="w-4 h-4 inline mr-2" />
                      Branch
                    </label>
                    <select
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch === "all" ? "All Branches" : branch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Search className="w-4 h-4 inline mr-2" />
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Instructors List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredInstructors.length > 0 ? (
                    filteredInstructors.map((instructor) => (
                      <button
                        key={instructor.instructor_id}
                        onClick={() => {
                          if (selectedInstructor?.instructor_id === instructor.instructor_id) {
                            setSelectedInstructor(null);
                          } else {
                            setSelectedInstructor(instructor);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedInstructor?.instructor_id ===
                          instructor.instructor_id
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {instructor.users?.first_name}{" "}
                              {instructor.users?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {instructor.users?.email}
                            </p>
                            <p className="text-xs text-indigo-600 mt-1">
                              Branch: {instructor.branch || "N/A"}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedInstructor?.instructor_id ===
                              instructor.instructor_id
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedInstructor?.instructor_id ===
                              instructor.instructor_id && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No instructors found
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Advisor Details
                </h2>

                {selectedInstructor ? (
                  <form onSubmit={handleAddAdvisor} className="space-y-4">
                    {/* Selected Instructor Info */}
                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-sm text-gray-600">Selected:</p>
                      <p className="font-semibold text-indigo-900">
                        {selectedInstructor.users?.first_name}{" "}
                        {selectedInstructor.users?.last_name}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {selectedInstructor.users?.email}
                      </p>
                    </div>

                    {/* Degree */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree Level
                      </label>
                      <select
                        value={formData.forDegree}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            forDegree: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {degrees.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch (Academic Year)
                      </label>
                      <input
                        type="number"
                        value={formData.batch}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            batch: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {submitting ? "Adding..." : "Add as Advisor"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an instructor from the list</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddAdvisorPage;
