import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronDown,
  Calendar as CalendarIcon,
  ArrowLeft,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import BookingCard from "../../components/common/BookingCard";
import { useBookings } from "../../hooks";

export default function BookingList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const ownerId = searchParams.get("ownerId");
  const vehicleId = searchParams.get("vehicleId");

  const { bookings, loading, error, fetchBookings } = useBookings();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("id"); // id, customerId, vehicleId, ownerId
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data from API
  useEffect(() => {
    loadBookings();
  }, [currentPage, filterStatus, userId, ownerId, vehicleId]);

  const loadBookings = async () => {
    try {
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterStatus !== "all") filters.status = filterStatus;
      if (userId) filters.userId = userId;
      if (ownerId) filters.ownerId = ownerId;
      if (vehicleId) filters.vehicleId = vehicleId;
      if (searchTerm && searchBy) {
        filters.search = searchTerm;
        filters.searchBy = searchBy;
      }

      await fetchBookings(filters);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadBookings();
  };

  // Filter bookings by date (client-side)
  let displayBookings = [...bookings];

  const now = new Date();
  displayBookings = displayBookings.filter((booking) => {
    const bookingDate = new Date(booking.createdDate || booking.createdAt);

    switch (dateFilter) {
      case "today":
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        return bookingDate >= today;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return bookingDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return bookingDate >= monthAgo;
      case "custom":
        if (customFromDate && customToDate) {
          const from = new Date(customFromDate);
          const to = new Date(customToDate);
          to.setHours(23, 59, 59, 999);
          return bookingDate >= from && bookingDate <= to;
        }
        return true;
      default:
        return true;
    }
  });

  // Sort
  displayBookings = [...displayBookings].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return (
          new Date(b.createdDate || b.createdAt) -
          new Date(a.createdDate || a.createdAt)
        );
      case "amount":
        return b.total - a.total;
      case "duration":
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: bookings.length,
    pending_payment: bookings.filter((b) => b.status === "pending_payment").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    completed_with_charge: bookings.filter((b) => b.status === "completed_with_charge").length,
    booking: bookings.filter((b) => b.status === "booking").length,
    picked_up: bookings.filter((b) => b.status === "picked_up").length,
    return_submitted: bookings.filter((b) => b.status === "return_submitted").length,
    dispute_opened: bookings.filter((b) => b.status === "dispute_opened").length,
    under_review: bookings.filter((b) => b.status === "under_review").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [
    searchTerm,
    filterStatus,
    dateFilter,
    customFromDate,
    customToDate,
    sortBy,
  ]);

  return (
    <div>
      {/* Back button */}
      {(userId || ownerId || vehicleId) && (
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      )}

      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">
          {userId
            ? "User Bookings"
            : ownerId
              ? "Owner Bookings"
              : vehicleId
                ? "Vehicle Bookings"
                : "All Bookings"}
        </h1>
        <p className="text-[#717685]">View and manage rental bookings</p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Bookings" },
          { id: "pending_payment", label: "Pending Payment" },
          { id: "pending_contract", label: "Pending Contract" },
          { id: "booking", label: "Confirmed Booking" },
          { id: "picked_up", label: "Picked Up" },
          { id: "return_submitted", label: "Return Submitted" },
          { id: "under_review", label: "Under Review" },
          { id: "dispute_opened", label: "Dispute Opened" },
          { id: "completed_with_charge", label: "Completed With Charge" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
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
        <div className="flex flex-col gap-4">
          {/* First row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-medium text-[#131A34]"
              >
                <option value="id">Booking ID</option>
                <option value="customerId">Customer ID</option>
                <option value="vehicleId">Vehicle ID</option>
                <option value="ownerId">Owner ID</option>
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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
            >
              <option value="date">Sort by Date (Recent First)</option>
              <option value="amount">Sort by Amount</option>
              <option value="duration">Sort by Duration</option>
            </select>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Date Period
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {dateFilter === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#131A34] mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#131A34] mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing{" "}
          <span className="font-semibold text-[#131A34]">
            {displayBookings.length}
          </span>{" "}
          bookings
        </p>
        {(searchTerm || filterStatus !== "all" || dateFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setDateFilter("all");
              setCustomFromDate("");
              setCustomToDate("");
              setSearchBy("id");
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
            <p className="text-[#717685] font-semibold">Loading bookings...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadBookings}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* booking list */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {displayBookings.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
              <p className="text-[#717685] text-lg font-medium">
                No bookings found
              </p>
              <p className="text-[#B2BCE0] text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  basePath="/bookings"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && displayBookings.length > 0 && (
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
            disabled={displayBookings.length < itemsPerPage}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
