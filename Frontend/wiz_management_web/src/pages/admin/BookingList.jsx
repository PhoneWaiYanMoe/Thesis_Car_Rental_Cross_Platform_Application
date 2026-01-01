import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  Calendar as CalendarIcon,
  ArrowLeft,
} from "lucide-react";

import Pagination from "../../components/Pagination";
import BookingCard from "../../components/BookingCard";

export default function BookingList({ bookingData, carData, userData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const ownerId = searchParams.get("ownerId");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter bookings
  let filteredBookings = bookingData;

  // Apply user filter if provided in URL
  if (userId) {
    filteredBookings = filteredBookings.filter((b) => b.userId === userId);
  }

  // Apply owner filter if provided in URL
  if (ownerId) {
    filteredBookings = filteredBookings.filter((b) => b.ownerId === ownerId);
  }

  // Apply search filter
  filteredBookings = filteredBookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    // REMOVE this line: const matchesUser = filterUser === 'all' || booking.userId === filterUser;

    return matchesSearch && matchesStatus; // REMOVE matchesUser
  });

  // Apply date filter
  const now = new Date();
  filteredBookings = filteredBookings.filter((booking) => {
    const bookingDate = new Date(booking.createdDate);

    switch (dateFilter) {
      case "today":
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
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
  filteredBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.createdDate) - new Date(a.createdDate);
      case "amount":
        return b.total - a.total;
      case "duration":
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed",
      },
      ongoing: { bg: "bg-blue-50", text: "text-blue-700", label: "Ongoing" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
      upcoming: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Upcoming",
      },
    };
    return badges[status];
  };

  const statusCounts = {
    all: bookingData.length,
    completed: bookingData.filter((b) => b.status === "completed").length,
    ongoing: bookingData.filter((b) => b.status === "ongoing").length,
    cancelled: bookingData.filter((b) => b.status === "cancelled").length,
    upcoming: bookingData.filter((b) => b.status === "upcoming").length,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
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
      {/* ack button */}
      {(userId || ownerId) && (
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
            : "All Bookings"}
        </h1>
        <p className="text-[#717685]">View and manage rental bookings</p>
      </div>
      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Bookings" },
          { id: "upcoming", label: "Upcoming" },
          { id: "ongoing", label: "Ongoing" },
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
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by booking ID, car, or user..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
              />
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
            {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#131A34]">
            {filteredBookings.length}
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
              // REMOVE: setFilterUser('all');
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* booking list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {currentBookings.length === 0 ? (
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
            {currentBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                basePath="/admin/bookings"
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
