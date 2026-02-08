import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRequests } from "../../hooks";

export default function RequestList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const { requests, loading, error, fetchRequests } = useRequests();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("title"); // title, id, customerId
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("filter") || "all",
  );
  const [filterHandler, setFilterHandler] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = [
    "all",
    "General",
    "Payment",
    "Vehicle",
    "Booking",
    "Account",
    "Other",
  ];
  const handlers = ["all", "me"];

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      setFilterStatus(filter);
    }
  }, [searchParams]);

  // Load data from API
  useEffect(() => {
    loadRequests();
  }, [currentPage, filterStatus, filterCategory, filterHandler]);

  const loadRequests = async () => {
    try {
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterCategory !== "all") filters.category = filterCategory;
      if (filterHandler === "me") {
        filters.handledBy = user?.username || user?.email;
      } else if (filterHandler !== "all") {
        filters.handledBy = filterHandler;
      }
      if (searchTerm && searchBy) {
        filters.search = searchTerm;
        filters.searchBy = searchBy;
      }

      await fetchRequests(filters);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadRequests();
  };

  // Client-side sorting
  let displayRequests = [...requests];
  displayRequests = displayRequests.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "processing":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "denied":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "paused":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Pending",
      },
      processing: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "Processing",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Approved",
      },
      denied: { bg: "bg-red-50", text: "text-red-700", label: "Denied" },
      paused: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Paused",
      },
    };
    return badges[status] || badges.pending;
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    processing: requests.filter((r) => r.status === "processing").length,
    approved: requests.filter((r) => r.status === "approved").length,
    denied: requests.filter((r) => r.status === "denied").length,
    paused: requests.filter((r) => r.status === "paused").length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, filterCategory, filterHandler, sortBy]);

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">All Requests</h1>
        <p className="text-[#717685]">Manage and review customer requests</p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Requests" },
          { id: "pending", label: "Pending" },
          { id: "processing", label: "Processing" },
          { id: "approved", label: "Approved" },
          { id: "denied", label: "Denied" },
          { id: "paused", label: "Paused" },
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

      {/* search and filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* search */}
          <div className="flex-1 flex gap-2">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-medium text-[#131A34]"
            >
              <option value="title">Title</option>
              <option value="id">ID</option>
              <option value="customerId">Customer ID</option>
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder={`Search by ${searchBy}...`}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
            >
              Search
            </button>
          </div>

          {/* filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-[#F8F9FF] transition-all font-semibold text-[#131A34]"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">
                Handled By
              </label>
              <select
                value={filterHandler}
                onChange={(e) => setFilterHandler(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                <option value="all">All Handlers</option>
                <option value="me">My Requests</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing{" "}
          <span className="font-semibold text-[#131A34]">
            {displayRequests.length}
          </span>{" "}
          results
        </p>
        {(searchTerm ||
          filterCategory !== "all" ||
          filterStatus !== "all" ||
          filterHandler !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
              setFilterHandler("all");
              setSearchBy("title");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
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

      {/* request list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {displayRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#F8F9FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#B2BCE0]" />
            </div>
            <p className="text-[#717685] text-lg font-medium">
              No requests found
            </p>
            <p className="text-[#B2BCE0] text-sm mt-1">
              Try adjusting your filters
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
                    <div className="flex items-start gap-4 flex-1">
                      {/* content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                            {req.title}
                          </h4>
                          <span
                            className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                          >
                            {badge.label}
                          </span>
                          {req.photos.length > 0 && (
                            <span className="flex items-center gap-1 text-[#6679C0] text-xs font-semibold">
                              <ImageIcon className="w-4 h-4" />
                              {req.photos.length}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#717685] mb-2 flex-wrap">
                          <span className="font-medium text-xs">Request ID : {req.id}</span>
                          <span>•</span>
                          <span className="text-xs">Category : {req.category}</span>
                          <span>•</span>
                          <span className="text-xs">Requester Email : {req.userEmail}</span>
                        </div>

                        {/* <p className="text-sm text-[#717685] line-clamp-1">
                          {req.description}
                        </p> */}

                        {req.handledById && (
                          <div className="mt-2 text-xs text-[#717685] flex-wrap gap-2 items-center flex">
                            Handled by{" "}
                            <span className="text-[#131A34]">
                              {req.handledById}
                            </span>{" "}
                            <span></span>
                            <span></span>
                            on {new Date(req.handledAt).toLocaleDateString()}
                          </div>
                        )}
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

      {/* Pagination */}
      {!loading && !error && displayRequests.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-[#717685] font-medium">
            Page {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={displayRequests.length < itemsPerPage}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
