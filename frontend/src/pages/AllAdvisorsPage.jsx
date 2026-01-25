import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  GraduationCap,
  ChevronDown,
  Search,
  Check,
  X
} from "lucide-react";

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

function AllAdvisorsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState(new Set());
  const [batchFilter, setBatchFilter] = useState(new Set());
  const [branchFilter, setBranchFilter] = useState(new Set());

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchAdvisors();
  }, [isAuthenticated, user, navigate]);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/admin/advisors");

      if (res.data.success) {
        setAdvisors(res.data.data || []);
      } else {
        setError("Failed to fetch advisors");
      }
    } catch (err) {
      console.error("Fetch advisors error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvisor = async (advisorId) => {
    if (!window.confirm("Are you sure you want to remove this advisor?")) {
      return;
    }

    try {
      setDeleting(advisorId);
      const res = await axiosClient.delete(`/admin/advisors/${advisorId}`);

      if (res.data.success) {
        toast.success("Advisor removed successfully!");
        setAdvisors((prev) =>
          prev.filter((advisor) => advisor.advisor_id !== advisorId)
        );
      } else {
        toast.error(res.data.message || "Failed to delete advisor");
      }
    } catch (err) {
      console.error("Delete advisor error:", err);
      toast.error(err.response?.data?.message || "Failed to delete advisor");
    } finally {
      setDeleting(null);
    }
  };

  const getUniqueValues = (key) => {
    // Handling nested keys if necessary or simple keys
    if (key === 'branch') {
      return [...new Set(advisors.map(a => a.instructor?.branch).filter(Boolean))].sort();
    }
    return [...new Set(advisors.map(a => a[key]).filter(Boolean))].sort();
  };

  const filteredAdvisors = advisors.filter(advisor => {
    const name = `${advisor.instructor?.users?.first_name} ${advisor.instructor?.users?.last_name}`.toLowerCase();
    const email = advisor.instructor?.users?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || name.includes(query) || email.includes(query);
    const matchesDegree = degreeFilter.size === 0 || degreeFilter.has(advisor.for_degree);
    const matchesBatch = batchFilter.size === 0 || batchFilter.has(String(advisor.batch));
    const matchesBranch = branchFilter.size === 0 || branchFilter.has(advisor.instructor?.branch);

    return matchesSearch && matchesDegree && matchesBatch && matchesBranch;
  });

  const clearAllFilters = () => {
    setDegreeFilter(new Set());
    setBatchFilter(new Set());
    setBranchFilter(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return degreeFilter.size > 0 || batchFilter.size > 0 || branchFilter.size > 0 || searchQuery;
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="alert alert-warning">
          <span>Only admins can access this page</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            All Advisors
          </h1>
          <p className="text-lg text-gray-600">
            Manage student advisors and their assignments
          </p>
        </div>
        <button
          onClick={() => navigate("/add-advisor")}
          className="btn bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 shadow-sm"
        >
          <Plus size={20} />
          Add New Advisor
        </button>
      </div>

      {error && (
        <div className="px-6 pt-6">
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search advisor by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
          </div>

          <FilterDropdown
            label="Degree"
            options={getUniqueValues('for_degree')}
            selected={degreeFilter}
            setSelected={setDegreeFilter}
          />
          <FilterDropdown
            label="Batch"
            options={getUniqueValues('batch').map(String)}
            selected={batchFilter}
            setSelected={setBatchFilter}
          />
          <FilterDropdown
            label="Branch"
            options={getUniqueValues('branch')}
            selected={branchFilter}
            setSelected={setBranchFilter}
          />

          <div className="w-14 ml-2 flex justify-center">
            <button
              onClick={clearAllFilters}
              className={`btn btn-ghost btn-sm text-slate-600 transition-all duration-200 ${hasActiveFilters()
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
                }`}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-[1600px] mx-auto">
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl">
            <span className="text-blue-800 font-medium text-sm">
              {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </div>
        )}

        {filteredAdvisors.length === 0 ? (
          <div className="bg-white border border-slate-200 text-slate-500 px-6 py-12 rounded-xl text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <span className="text-lg font-medium block">No advisors found.</span>
            <span className="text-sm text-slate-400">Try adjusting your filters or search criteria.</span>
            {!hasActiveFilters() && advisors.length === 0 && (
              <button
                onClick={() => navigate("/add-advisor")}
                className="mt-6 btn bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 shadow-sm"
              >
                <Plus size={20} />
                Create First Advisor
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAdvisors.map((advisor) => (
              <div
                key={advisor.advisor_id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden relative"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                        {advisor.instructor?.users?.first_name} {advisor.instructor?.users?.last_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{advisor.instructor?.users?.email}</p>
                    </div>
                    {advisor.instructor?.branch && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 bg-white text-slate-600 uppercase tracking-wide flex-shrink-0">
                        {advisor.instructor.branch}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 flex flex-col border border-blue-100">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wide mb-1">Degree</span>
                      <span className="text-sm font-bold text-blue-700">{advisor.for_degree}</span>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 flex flex-col border border-indigo-100">
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wide mb-1">Batch</span>
                      <span className="text-sm font-bold text-indigo-700">{advisor.batch}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 pt-0 mt-auto">
                  <button
                    onClick={() => handleDeleteAdvisor(advisor.advisor_id)}
                    disabled={deleting === advisor.advisor_id}
                    className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    {deleting === advisor.advisor_id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Advisor
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllAdvisorsPage;
