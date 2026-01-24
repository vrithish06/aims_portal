import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";
import { Users, Plus, Trash2, AlertCircle, GraduationCap } from "lucide-react";

function AllAdvisorsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [filterDegree, setFilterDegree] = useState("all");

  const degrees = ["BTech", "MTech", "PhD"];

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
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-gray-600">Loading advisors...</p>
        </div>
      </div>
    );
  }

  const filteredAdvisors =
    filterDegree === "all"
      ? advisors
      : advisors.filter((a) => a.for_degree === filterDegree);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">All Advisors</h1>
          </div>
          <button
            onClick={() => navigate("/add-advisor")}
            className="btn btn-primary gap-2"
          >
            <Plus size={20} />
            Add New Advisor
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter */}
        {advisors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <label className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">
                Filter by Degree:
              </span>
              <select
                value={filterDegree}
                onChange={(e) => setFilterDegree(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Degrees</option>
                {degrees.map((degree) => (
                  <option key={degree} value={degree}>
                    {degree}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* No Advisors */}
        {advisors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-6">
              No advisors assigned yet
            </p>
            <button
              onClick={() => navigate("/add-advisor")}
              className="btn btn-primary gap-2"
            >
              <Plus size={20} />
              Create First Advisor
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-center font-semibold">
                      Degree
                    </th>
                    <th className="px-6 py-3 text-center font-semibold">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvisors.map((advisor, idx) => (
                    <tr
                      key={advisor.advisor_id}
                      className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {advisor.instructor?.users?.first_name}{" "}
                        {advisor.instructor?.users?.last_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {advisor.instructor?.users?.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {advisor.instructor?.branch}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {advisor.for_degree}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-800">
                        {advisor.batch}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleDeleteAdvisor(advisor.advisor_id)
                          }
                          disabled={deleting === advisor.advisor_id}
                          className="btn btn-ghost btn-sm text-error"
                          title="Remove advisor"
                        >
                          {deleting === advisor.advisor_id ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid gap-4">
              {filteredAdvisors.map((advisor) => (
                <div
                  key={advisor.advisor_id}
                  className="bg-white rounded-lg shadow p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {advisor.instructor?.users?.first_name}{" "}
                        {advisor.instructor?.users?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {advisor.instructor?.users?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAdvisor(advisor.advisor_id)}
                      disabled={deleting === advisor.advisor_id}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      {deleting === advisor.advisor_id ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      {advisor.instructor?.branch}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {advisor.for_degree}
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded font-semibold">
                      Batch {advisor.batch}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-600 mt-8">
              <p className="text-sm">
                Total Advisors: <span className="font-semibold">{advisors.length}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllAdvisorsPage;
