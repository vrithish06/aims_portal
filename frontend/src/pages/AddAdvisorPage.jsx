import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import { Users, Plus, Search, Filter, Check, ChevronDown, Scale } from "lucide-react";

/* ================= FILTER DROPDOWN ================= */
function FilterDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (opt) => {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    setSelected(newSet);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-colors"
      >
        {label}
        {selected.size > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-blue-600 rounded-full border border-white shadow-sm">
            {selected.size}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 text-left transition-colors"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.has(opt)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-300"
                  }`}
              >
                {selected.has(opt) && <Check className="w-3 h-3" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddAdvisorPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // Filters
  const [branchFilter, setBranchFilter] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    forDegree: "BTech",
    branch: "All",
    batch: new Date().getFullYear(),
  });

  const degrees = ["BTech", "MTech", "PhD"];

  const branches = [
    { value: "CSE", label: "Computer Science Engineering" },
    { value: "EE", label: "Electrical Engineering" },
    { value: "MNC", label: "Mathematics and Computing" },
    { value: "MECH", label: "Mechanical Engineering" },
    { value: "CHE", label: "Chemical Engineering" },
    { value: "CIVIL", label: "Civil Engineering" },
    { value: "AI", label: "Artificial Intelligence" }
  ];

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
        setInstructors(res.data.data || []);
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
    setError(""); // Clear previous errors

    if (!selectedInstructor) {
      const msg = "Please select an instructor";
      toast.error(msg);
      setError(msg);
      return;
    }

    if (!formData.forDegree || !formData.batch || !formData.branch) {
      const msg = "Please fill all fields";
      toast.error(msg);
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        instructor_id: selectedInstructor.instructor_id,
        for_degree: formData.forDegree,
        branch: formData.branch === "All" ? null : formData.branch,
        batch: formData.batch,
      };
      console.log("[AddAdvisor] Sending payload:", payload);

      const res = await axiosClient.post("/admin/add-advisor", payload);

      if (res.data.success) {
        toast.success("Advisor added successfully!");
        setSelectedInstructor(null);
        setFormData({
          forDegree: "BTech",
          branch: "All",
          batch: new Date().getFullYear(),
        });
        // Navigate to all advisors page after 1 second
        setTimeout(() => {
          navigate("/all-advisors", {
            state: { successMessage: "Advisor added successfully" },
          });
        }, 1000);
      } else {
        const errorMsg = res.data.message || "Failed to add advisor";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Add advisor error:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || "Something went wrong";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getUniqueValues = (key) => {
    return [...new Set(instructors.map(i => i[key]).filter(Boolean))].sort();
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const name = `${instructor.users?.first_name} ${instructor.users?.last_name}`.toLowerCase();
    const email = instructor.users?.email?.toLowerCase() || "";
    const query = searchTerm.toLowerCase();

    const matchesBranch = branchFilter.size === 0 || branchFilter.has(instructor.branch);
    const matchesSearch = !searchTerm || name.includes(query) || email.includes(query);

    return matchesBranch && matchesSearch;
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">


        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-40">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Fetching instructors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instructors List Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    Select Instructor
                  </h2>
                  <div className="flex gap-2">
                    <FilterDropdown
                      label="Branch"
                      options={getUniqueValues('branch')}
                      selected={branchFilter}
                      setSelected={setBranchFilter}
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search instructor by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Instructors List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${selectedInstructor?.instructor_id ===
                          instructor.instructor_id
                          ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white"
                          }`}
                      >
                        {selectedInstructor?.instructor_id === instructor.instructor_id && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                        )}

                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <p className={`font-bold text-base ${selectedInstructor?.instructor_id === instructor.instructor_id ? 'text-blue-900' : 'text-slate-800'}`}>
                              {instructor.users?.first_name} {instructor.users?.last_name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {instructor.users?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200 uppercase">
                                {instructor.branch || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${selectedInstructor?.instructor_id ===
                              instructor.instructor_id
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 text-transparent group-hover:border-blue-300"
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>No instructors found matching your filters.</p>
                    </div>
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
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      >
                        {degrees.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch
                      </label>
                      <div className="relative">
                        <select
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              branch: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value="All">All Branches</option>
                          {branches.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Select specific branch or "All" for general advisor
                      </p>
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
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add as Advisor
                        </>
                      )}
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
