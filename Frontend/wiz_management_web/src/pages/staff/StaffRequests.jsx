import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, AlertCircle } from "lucide-react";
import { useUsers, useRequests } from "../../hooks";

export default function StaffRequests() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const { getUserById } = useUsers();
  const { requests, loading, error, fetchRequests } = useRequests();

  const [staff, setStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadStaffData();
  }, [staffId]);

  useEffect(() => {
    if (staff) {
      loadRequests();
    }
  }, [staff, filterStatus]);

  const loadStaffData = async () => {
    try {
      const userData = await getUserById(staffId);
      setStaff(userData);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  const loadRequests = async () => {
    try {
      const filters = {
        handledBy: staff.email || staff.username,
        limit: 1000,
      };

      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }

      await fetchRequests(filters);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Approved",
      },
      denied: { bg: "bg-red-50", text: "text-red-700", label: "Denied" },
    };
    return badges[status] || badges.pending;
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    denied: requests.filter((r) => r.status === "denied").length,
  };

  let displayRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  // Loading state
  if (loading && !staff) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#717685] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/staff")}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Staff
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">
            {staff?.full_name || staff?.name}'s Requests
          </h1>
          <p className="text-[#717685]">
            Viewing all requests handled by this staff member
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "approved", label: "Approved" },
          { id: "denied", label: "Denied" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filterStatus === tab.id
                ? "bg-[#6679C0] text-white shadow-lg"
                : "text-[#717685] hover:bg-[#F8F9FF]"
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterStatus === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-[#717685]"
              }`}
            >
              {statusCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#717685] font-semibold">Loading requests...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadRequests}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Request list */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {displayRequests.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
              <p className="text-[#717685] text-lg font-medium">
                No requests found
              </p>
              <p className="text-[#B2BCE0] text-sm mt-1">
                This staff member hasn't handled any{" "}
                {filterStatus !== "all" ? filterStatus : ""} requests yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayRequests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                            {req.title}
                          </h4>
                          <span
                            className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#717685] mb-2 flex-wrap">
                          <span className="font-medium">{req.id}</span>
                          <span>•</span>
                          <span>{req.category}</span>
                          <span>•</span>
                          <span>{req.customerName}</span>
                        </div>

                        <p className="text-sm text-[#717685] line-clamp-1">
                          {req.body}
                        </p>

                        {req.handledAt && (
                          <div className="mt-2 text-xs text-[#717685]">
                            Handled on{" "}
                            {new Date(req.handledAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#717685]">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
