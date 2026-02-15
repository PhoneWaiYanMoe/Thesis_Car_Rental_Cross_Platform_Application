import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  AlertCircle,
  UserPlus,
  Filter,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useUsers } from "../../hooks";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function StaffManagement() {
  const navigate = useNavigate();
  const {
    getSupportUsers,
    updateUserStatus,
    createUser,
    verifyEmailOTP,
    resendOTP,
  } = useUsers();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("fullName"); // fullName, email, id
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [showFilters, setShowFilters] = useState(false);

  const userTypes = ["all", "customer", "owner"];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Data States
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Create Staff Form
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [createError, setCreateError] = useState("");

  // OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(1800); // 30 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Load staff data from API
  useEffect(() => {
    loadStaffData();
  }, [currentPage, filterStatus, sortBy, sortOrder]);

  const loadStaffData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };

      // Only add search if there's a value
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (searchBy) {
        params.searchBy = searchBy;
      }

      // Only add status filter if selected
      if (filterStatus && filterStatus !== "all") {
        params.status = filterStatus;
      }

      const response = await getSupportUsers(params);
      setStaff(response.users || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || "Failed to load staff");
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search - triggered on button click or Enter key
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    loadStaffData();
  };

  // Handle status change
  const handleStatusChange = (staff, status) => {
    setSelectedStaff(staff);
    setNewStatus(status);
    setShowStatusUpdate(false);
    setShowConfirm(true);
    setConfirmType("status");
  };

  // Handle create staff button click
  const handleCreateStaff = () => {
    setCreateError("");

    // Validate form
    if (!newStaff.fullName.trim()) {
      setCreateError("Full name is required");
      return;
    }
    if (!newStaff.email.trim()) {
      setCreateError("Email is required");
      return;
    }
    if (!newStaff.password || newStaff.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    setConfirmType("create");
    setShowConfirm(true);
  };

  // Confirm action (create or status update)
  const handleConfirm = async () => {
    try {
      if (confirmType === "create") {
        // Create new staff member
        const result = await createUser({
          fullName: newStaff.fullName,
          email: newStaff.email,
          password: newStaff.password,
          phone: newStaff.phone || null,
          role: "support", // Always create as support role
        });

        // Close create modal and confirmation
        setShowCreateModal(false);
        setShowConfirm(false);

        // Open OTP verification modal
        setOtpEmail(newStaff.email);
        setOtpCode("");
        setOtpError("");
        setOtpTimer(1800); // Reset to 30 minutes
        setCanResend(false);
        setShowOTPModal(true);

        // Don't reset newStaff yet - keep email for display
      } else if (confirmType === "status") {
        // Update status
        await updateUserStatus(selectedStaff.id, newStatus);
        setShowConfirm(false);
        setSelectedStaff(null);

        // Reload data to reflect changes
        loadStaffData();
      }
    } catch (err) {
      console.error("Failed to perform action:", err);
      setCreateError(err.response?.data?.message || "Operation failed");
      setShowConfirm(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setOtpError("");

    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await verifyEmailOTP(otpEmail, otpCode);

      // Success! Close modal and reset
      setShowOTPModal(false);
      setNewStaff({ fullName: "", email: "", password: "", phone: "" });
      setOtpCode("");
      setOtpEmail("");

      // Reload staff list to show new verified staff
      loadStaffData();

      // Show success message (optional)
      alert("Staff account created and verified successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP code");
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setResending(true);
    setOtpError("");

    try {
      await resendOTP(otpEmail);

      // Reset timer
      setOtpTimer(1800);
      setCanResend(false);
      setResending(false);

      alert("OTP resent successfully! Check your email.");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend OTP");
      setResending(false);
    }
  };

  // Format timer display (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get status badge styling
  const getStatusBadge = (status, role) => {
    // Admin has special badge
    if (role === "admin") {
      return { text: "text-purple-700", label: "Admin" };
    }

    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      suspended: {
        text: "text-yellow-700",
        label: "Suspended",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
    };

    return (
      badges[status] || {
        text: "text-gray-700",
        label: "Active",
      }
    );
  };

  // Calculate status counts from current staff list
  const statusCounts = {
    all: pagination?.total || staff.length,
    normal: staff.filter((s) => s.status === "normal").length,
    suspended: staff.filter((s) => s.status === "suspended").length,
    banned: staff.filter((s) => s.status === "banned").length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, sortBy, sortOrder]);

  // OTP Timer countdown
  useEffect(() => {
    if (showOTPModal && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showOTPModal, otpTimer]);

  // Loading state
  if (loading && !staff.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#717685] font-semibold">Loading staff...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !staff.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            Failed to Load Staff
          </h2>
          <p className="text-[#717685] mb-6">{error}</p>
          <button
            onClick={loadStaffData}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">
            Support Staff Management
          </h1>
          <p className="text-[#717685]">
            Manage customer support team accounts and performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Create New Staff
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "", label: "All Staff" },
          { id: "normal", label: "Active" },
          { id: "suspended", label: "Suspended" },
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
            {filterStatus === tab.id && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                {tab.id === "" ? statusCounts.all : statusCounts[tab.id]}
              </span>
            )}
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
          <span className="font-semibold text-[#131A34]">{staff.length}</span>{" "}
          of{" "}
          <span className="font-semibold text-[#131A34]">
            {pagination?.total || 0}
          </span>{" "}
          staff members
        </p>
        {(searchTerm || filterStatus) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("");
              setSortBy("created_at");
              setSortOrder("DESC");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {staff.map((member) => {
          const badge = getStatusBadge(member.status, member.role);
          const isAdmin = member.role === "admin";
          const isUnverified = member.isVerified === false;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6679C0] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(member.full_name || member.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#131A34]">
                      {member.full_name || member.email}
                    </h3>
                    <p className="text-xs text-[#717685] truncate max-w-[150px]">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className={`${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                  >
                    {badge.label}
                  </span>
                  {isUnverified && (
                    <span className="text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#717685]">ID:</span>
                  <span className="text-[#131A34] font-medium text-xs">
                    {member.id}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#717685]">Joined:</span>
                  <span className="text-[#131A34] font-medium">
                    {new Date(member.joinedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Performance Stats - Only show for verified users */}
              {!isUnverified && (
                <div className="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-gray-100">
                  <div
                    className={`text-center ${
                      !isAdmin ? "cursor-pointer hover:bg-[#F8F9FF]" : ""
                    } rounded-lg p-2 transition-all`}
                    onClick={() =>
                      !isAdmin &&
                      navigate(`/staff/${member.id}/requests?status=all`)
                    }
                  >
                    <p className="text-lg font-bold text-[#6679C0]">
                      {member.totalHandled || 0}
                    </p>
                    <p className="text-xs text-[#717685]">Handled</p>
                  </div>
                  <div
                    className={`text-center ${
                      !isAdmin ? "cursor-pointer hover:bg-[#F8F9FF]" : ""
                    } rounded-lg p-2 transition-all`}
                    onClick={() =>
                      !isAdmin &&
                      navigate(`/staff/${member.id}/requests?status=approved`)
                    }
                  >
                    <p className="text-lg font-bold text-green-600">
                      {member.totalApproved || 0}
                    </p>
                    <p className="text-xs text-[#717685]">Approved</p>
                  </div>
                  <div
                    className={`text-center ${
                      !isAdmin ? "cursor-pointer hover:bg-[#F8F9FF]" : ""
                    } rounded-lg p-2 transition-all`}
                    onClick={() =>
                      !isAdmin &&
                      navigate(`/staff/${member.id}/requests?status=denied`)
                    }
                  >
                    <p className="text-lg font-bold text-red-600">
                      {member.totalDenied || 0}
                    </p>
                    <p className="text-xs text-[#717685]">Denied</p>
                  </div>
                </div>
              )}

              {/* Actions - Different for unverified users */}
              {isUnverified ? (
                // Unverified user actions - Only OTP buttons
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setOtpEmail(member.email);
                      setOtpCode("");
                      setOtpError("");
                      setOtpTimer(1800);
                      setCanResend(false);
                      setShowOTPModal(true);
                    }}
                    className="w-full px-4 py-2.5 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all text-sm"
                  >
                    Enter OTP Code
                  </button>
                  <button
                    onClick={async () => {
                      setResending(true);
                      try {
                        await resendOTP(member.email);
                        alert("OTP resent successfully! Check your email.");
                      } catch (err) {
                        alert(
                          err.response?.data?.message || "Failed to resend OTP",
                        );
                      } finally {
                        setResending(false);
                      }
                    }}
                    disabled={resending}
                    className="w-full px-4 py-2.5 border border-[#6679C0] text-[#6679C0] rounded-xl font-semibold hover:bg-[#F8F9FF] transition-all text-sm disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              ) : (
                // Verified user actions - Only status management, NO view profile
                <div className="flex gap-2">
                  {!isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedStaff(member);
                        setShowStatusUpdate(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Status
                    </button>
                  )}
                  {isAdmin && (
                    <div className="flex-1 px-4 py-2.5 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold text-center">
                      Administrator
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {staff.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UserPlus className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <p className="text-[#717685] text-lg font-medium">
            No staff members found
          </p>
          <p className="text-[#B2BCE0] text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && staff.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34]
                 hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-[#717685] font-medium">
            Page {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={staff.length < itemsPerPage}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34]
                 hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#131A34] mb-2">
              Update Staff Status
            </h3>
            <p className="text-[#717685] mb-6">
              {selectedStaff.full_name || selectedStaff.email}
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleStatusChange(selectedStaff, "normal")}
                disabled={selectedStaff.status === "normal"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "normal"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Set as Active
              </button>
              <button
                onClick={() => handleStatusChange(selectedStaff, "suspended")}
                disabled={selectedStaff.status === "suspended"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "suspended"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                }`}
              >
                Suspend Account
              </button>
              <button
                onClick={() => handleStatusChange(selectedStaff, "banned")}
                disabled={selectedStaff.status === "banned"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "banned"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Ban Staff Member
              </button>
            </div>

            <button
              onClick={() => {
                setShowStatusUpdate(false);
                setSelectedStaff(null);
              }}
              className="w-full px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#131A34] mb-6">
              Create New Staff Account
            </h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStaff.fullName}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewStaff({
                    fullName: "",
                    email: "",
                    password: "",
                    phone: "",
                  });
                  setCreateError("");
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={
                  !newStaff.fullName || !newStaff.email || !newStaff.password
                }
                className="flex-1 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#131A34] mb-2">
              Verify Email Address
            </h3>
            <p className="text-[#717685] mb-6">
              We've sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-[#131A34]">{otpEmail}</span>
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {otpError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#131A34] mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(value);
                }}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none text-center text-2xl font-bold tracking-widest"
                placeholder="000000"
              />
            </div>

            {/* Timer Display */}
            <div className="mb-6 text-center">
              {otpTimer > 0 ? (
                <p className="text-sm text-[#717685]">
                  Code expires in{" "}
                  <span className="font-semibold text-[#6679C0]">
                    {formatTimer(otpTimer)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold">
                  Code expired! Please request a new one.
                </p>
              )}
            </div>

            {/* Resend OTP */}
            <div className="mb-6 text-center">
              <button
                onClick={handleResendOTP}
                disabled={!canResend || resending || otpTimer > 0}
                className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtpCode("");
                  setOtpError("");
                  setNewStaff({
                    fullName: "",
                    email: "",
                    password: "",
                    phone: "",
                  });
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || otpTimer === 0}
                className="flex-1 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={
          confirmType === "create"
            ? "Create Staff Account?"
            : `Change Status to ${newStatus}?`
        }
        message={
          confirmType === "create"
            ? `Create a new staff account for ${newStaff.fullName}? They will receive support staff permissions.`
            : `Are you sure you want to change ${selectedStaff?.full_name || selectedStaff?.email}'s status to ${newStatus}?`
        }
        type="approve"
      />
    </div>
  );
}
