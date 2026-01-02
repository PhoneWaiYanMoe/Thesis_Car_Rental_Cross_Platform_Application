import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ImageIcon,
} from "lucide-react";

export default function StaffRequests({ requests, staffData }) {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(statusFilter);

  useEffect(() => {
    setFilterStatus(statusFilter);
  }, [statusFilter]);

  const staff = staffData.find((s) => s.id === staffId);

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-[#717685] text-lg font-medium">
            Staff member not found
          </p>
          <button
            onClick={() => navigate("/admin/staff")}
            className="mt-4 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Staff Management
          </button>
        </div>
      </div>
    );
  }

  // const staff = staffData.find(s => s.id === staffId);

  console.log("Staff ID from URL:", staffId);
  console.log("Staff found:", staff);
  console.log("All requests:", requests.length);
  console.log(
    "Staff requests:",
    requests.filter((r) => r.handledBy === staff?.username)
  );

  // Filter by staff member first
  let filteredRequests = requests.filter(
    (req) => req.handledBy === staff.username
  );

  // Then apply search and status filters
  filteredRequests = filteredRequests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort by handled date
  filteredRequests = [...filteredRequests].sort((a, b) => {
    return new Date(b.handledAt) - new Date(a.handledAt);
  });

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
    return badges[status];
  };

  // Calculate counts for this staff member only
  const staffRequests = requests.filter((r) => r.handledBy === staff.username);
  const statusCounts = {
    all: staffRequests.length,
    approved: staffRequests.filter((r) => r.status === "approved").length,
    denied: staffRequests.filter((r) => r.status === "denied").length,
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/staff")}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Staff Management
        </button>
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">
          Requests Handled by {staff.username}
        </h1>
        <p className="text-[#717685]">
          View all requests handled by this staff member
        </p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Requests" },
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

      {/* search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, ID, or customer name..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing{" "}
          <span className="font-semibold text-[#131A34]">
            {filteredRequests.length}
          </span>{" "}
          requests
        </p>
        {(searchTerm || filterStatus !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* request list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
            <p className="text-[#717685] text-lg font-medium">
              No requests found
            </p>
            <p className="text-[#B2BCE0] text-sm mt-1">
              {statusFilter !== "all"
                ? `This staff member has no ${statusFilter} requests`
                : "This staff member has not handled any requests yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <div
                  key={req.id}
                  onClick={() => navigate(`/support/requests/${req.id}`)}
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
                        {req.photos && req.photos.length > 0 && (
                          <span className="flex items-center gap-1 text-[#6679C0] text-xs font-semibold">
                            <ImageIcon className="w-4 h-4" />
                            {req.photos.length}
                          </span>
                        )}
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

                      <div className="mt-2 text-xs text-[#717685]">
                        Handled on{" "}
                        {new Date(req.handledAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    {/* view button */}
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
    </div>
  );
}
