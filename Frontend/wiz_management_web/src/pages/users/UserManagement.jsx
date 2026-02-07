import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, ChevronDown, User as UserIcon } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import UserCard from "../../components/common/UserCard";
import { useUsers } from "../../hooks";

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { users, loading, error, fetchUsers } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("fullName"); // fullName, email, id
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const userTypes = ["all", "customer", "owner"];

  // Load data from API
  useEffect(() => {
    loadUsers();
  }, [currentPage, filterStatus, filterType]);

  const loadUsers = async () => {
    try {
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterType !== "all") filters.role = filterType;
      if (searchTerm && searchBy) {
        filters.search = searchTerm;
        filters.searchBy = searchBy;
      }

      await fetchUsers(filters);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  // Filter and sort users locally
  let displayUsers = [...users];

  // Client-side sorting (since API might not support all sort options)
  displayUsers = displayUsers.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.full_name || a.name || "").localeCompare(
          b.full_name || b.name || "",
        );
      case "joined":
        return (
          new Date(b.joinedDate || b.createdAt) -
          new Date(a.joinedDate || a.createdAt)
        );
      case "bookings":
        return (b.totalBookings || 0) - (a.totalBookings || 0);
      case "rentals":
        return (b.totalRentals || 0) - (a.totalRentals || 0);
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: users.length,
    normal: users.filter((u) => u.status === "normal").length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    banned: users.filter((u) => u.status === "banned").length,
    deleted: users.filter((u) => u.status === "deleted").length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, filterType, sortBy]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">
          User Management
        </h1>
        <p className="text-[#717685]">Manage all users on the platform</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Users" },
          { id: "normal", label: "Normal" },
          { id: "active", label: "Active" },
          { id: "suspended", label: "Suspended" },
          { id: "banned", label: "Banned" },
          { id: "deleted", label: "Deleted" },
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

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-medium text-[#131A34]"
            >
              <option value="fullName">Name</option>
              <option value="email">Email</option>
              <option value="id">ID</option>
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

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-[#F8F9FF] transition-all font-semibold text-[#131A34]"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="name">Sort by Name</option>
            <option value="joined">Sort by Join Date</option>
            <option value="bookings">Sort by Bookings</option>
            <option value="rentals">Sort by Rentals</option>
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">
                User Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                {userTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all"
                      ? "All Types"
                      : type === "customer"
                        ? "Customers"
                        : "Car Owners"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing{" "}
          <span className="font-semibold text-[#131A34]">
            {displayUsers.length}
          </span>{" "}
          users
        </p>
        {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterType("all");
              setSearchBy("fullName");
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
            <p className="text-[#717685] font-semibold">Loading users...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* User List */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {displayUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserIcon className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
              <p className="text-[#717685] text-lg font-medium">
                No users found
              </p>
              <p className="text-[#B2BCE0] text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayUsers.map((user) => (
                <UserCard key={user.id} user={user} basePath="/users" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination - Note: Backend handles pagination, this is just for display */}
      {!loading && !error && displayUsers.length > 0 && (
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
            disabled={displayUsers.length < itemsPerPage}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
