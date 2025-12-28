import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

export default function UserManagement({ userData }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const userTypes = ["all", "renter", "owner"];

  let filteredUsers = userData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    const matchesType = filterType === "all" || user.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // sort
  filteredUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "joined":
        return new Date(b.joinedDate) - new Date(a.joinedDate);
      case "bookings":
        return b.totalBookings - a.totalBookings;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Normal" },
      stopped: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Stopped",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
    };
    return badges[status];
  };

  const statusCounts = {
    all: userData.length,
    normal: userData.filter((u) => u.status === "normal").length,
    stopped: userData.filter((u) => u.status === "stopped").length,
    banned: userData.filter((u) => u.status === "banned").length,
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">Users</h1>
        <p className="text-[#717685]">View all users on the platform</p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Users" },
          { id: "normal", label: "Normal" },
          { id: "stopped", label: "Stopped" },
          { id: "banned", label: "Banned" },
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
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
            />
          </div>

          {/* filter button */}
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

          {/* sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="name">Sort by Name</option>
            <option value="joined">Sort by Join Date</option>
            <option value="bookings">Sort by Bookings</option>
          </select>
        </div>

        {/* advanced filters */}
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
                      : type === "renter"
                      ? "Renters"
                      : "Car Owners"}
                  </option>
                ))}
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
            {filteredUsers.length}
          </span>{" "}
          users
        </p>
        {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterType("all");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* user list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
            <p className="text-[#717685] text-lg font-medium">No users found</p>
            <p className="text-[#B2BCE0] text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const badge = getStatusBadge(user.status);
              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/support/users/${user.id}`)}
                  className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#6679C0] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                            {user.name}
                          </h4>
                          <span
                            className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                          >
                            {badge.label}
                          </span>
                          <span className="bg-[#F8F9FF] text-[#6679C0] px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {user.type === "renter" ? "Renter" : "Car Owner"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#717685]">
                          <span>{user.email}</span>
                          <span>•</span>
                          <span>{user.id}</span>
                          <span>•</span>
                          <span>
                            Joined{" "}
                            {new Date(user.joinedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-sm text-[#717685]">Bookings</p>
                        <p className="font-bold text-[#131A34]">
                          {user.totalBookings}
                        </p>
                      </div>
                      {user.type === "owner" && (
                        <div>
                          <p className="text-sm text-[#717685]">Cars</p>
                          <p className="font-bold text-[#131A34]">
                            {user.totalCars || 0}
                          </p>
                        </div>
                      )}
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
