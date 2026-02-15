import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CarCard from "../../components/common/CarCard";
import BookingCard from "../../components/common/BookingCard";
import ReviewList from "../../components/common/ReviewList";
import { useUsers, useVehicles, useBookings, useReviews } from "../../hooks";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { getUserById, updateUserStatus, changeUserRole } = useUsers();
  const { getVehiclesByOwner } = useVehicles();
  const { getBookingsByUser } = useBookings();
  const { getOwnerReviews } = useReviews();

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showRoleUpdate, setShowRoleUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newRole, setNewRole] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");

  const canUpdateStatus = hasPermission(
    currentUser?.type,
    "UPDATE_USER_STATUS",
  );

  // Load user data
  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user details
      const userData = await getUserById(id);
      setUser(userData);

      // Fetch user bookings
      try {
        const bookings = await getBookingsByUser(id);
        setBookings(bookings || []);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        setBookings([]);
      }

      // If owner, fetch their vehicles
      if (userData.type === "owner" || userData.role === "owner") {
        try {
          const ownerVehicles = await getVehiclesByOwner(id);
          setVehicles(ownerVehicles || []);
        } catch (err) {
          console.error("Failed to load vehicles:", err);
          setVehicles([]);
        }
      }

      // Fetch reviews for this vehicle
      try {
        const { reviews: ownerReviews } = await getOwnerReviews(id, 1, 10);
        setReviews(ownerReviews || []);
      } catch (reviewError) {
        console.error("Failed to load reviews:", reviewError);
        // Continue even if reviews fail
        setReviews([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user");
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setConfirmAction("status");
    setShowConfirm(true);
  };

  const handleRoleChange = (role) => {
    setNewRole(role);
    setConfirmAction("role");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      if (confirmAction === "status") {
        await updateUserStatus(user.id, newStatus);
        setUser({ ...user, status: newStatus });
        setShowStatusUpdate(false);
      } else if (confirmAction === "role") {
        await changeUserRole(user.id, newRole);
        setUser({ ...user, role: newRole, type: newRole });
        setShowRoleUpdate(false);
        // Reload data as role change might affect vehicles
        loadUserData();
      }
      setShowConfirm(false);
    } catch (err) {
      console.error("Failed to update user:", err);
      alert(`Failed to update user ${confirmAction}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Normal" },
      active: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      suspended: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Suspended",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
      deleted: { bg: "bg-red-50", text: "text-red-700", label: "Deleted" },
    };
    const badge = badges[status] || badges.normal;
    return (
      <div
        className={`inline-flex items-center ${badge.bg} ${badge.text} px-4 py-2 rounded-xl font-semibold`}
      >
        {badge.label}
      </div>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      customer: { bg: "bg-blue-50", text: "text-blue-700", label: "Customer" },
      owner: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Car Owner",
      },
      support: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        label: "Support",
      },
      admin: { bg: "bg-red-50", text: "text-red-700", label: "Admin" },
    };
    const badge = badges[role] || badges.customer;
    return (
      <div
        className={`inline-flex items-center ${badge.bg} ${badge.text} px-4 py-2 rounded-xl font-semibold`}
      >
        {badge.label}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#717685] font-semibold">Loading user...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            {error || "User Not Found"}
          </h2>
          <p className="text-[#717685] mb-6">
            {error || "The user you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/users")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#6679C0] rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#131A34] mb-2">
                {user.full_name}
              </h1>
              <p className="text-[#717685]">User ID: {user.id}</p>
            </div>
          </div>
          {getStatusBadge(user.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Full Name</p>
                  <p className="font-semibold text-[#131A34]">{user.full_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Email</p>
                  <p className="font-semibold text-[#131A34] break-all">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Phone</p>
                  <p className="font-semibold text-[#131A34]">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Location</p>
                  <p className="font-semibold text-[#131A34]">
                    {user.location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Joined Date</p>
                  <p className="font-semibold text-[#131A34]">
                    {new Date(user.joinedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">User Type</p>
                  <p className="font-semibold text-[#131A34]">
                    {user.type === "customer" ? "Customer" : "Car Owner"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Activity Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {user.totalBookings || 0}
                </p>
                <p className="text-sm text-[#717685]">Total Bookings</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {user.completedBookings || 0}
                </p>
                <p className="text-sm text-[#717685]">Completed</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {user.cancelledBookings || 0}
                </p>
                <p className="text-sm text-[#717685]">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Car Owner Statistics */}
          {user.type === "owner" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Car Owner Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">
                    {user.totalCars || 0}
                  </p>
                  <p className="text-sm text-[#717685]">Total Cars</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">
                    {user.totalRentals || 0}
                  </p>
                  <p className="text-sm text-[#717685]">Total Rentals</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">
                    {new Intl.NumberFormat("vi-VN").format(
                      user.totalEarnings || 0,
                    )}{" "}
                    đ
                  </p>
                  <p className="text-sm text-[#717685]">Total Earnings</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">
                    ★ {user.rating || 4.5}
                  </p>
                  <p className="text-sm text-[#717685]">Rating</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#131A34]">
                Recent Bookings
              </h2>
              {bookings.length > 3 && (
                <button
                  onClick={() => navigate(`/bookings?userId=${user.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  See More
                </button>
              )}
            </div>
            <div className="space-y-4">
              {bookings.length > 0 ? (
                bookings.slice(0, 3).map((booking) => {
                  const car = vehicles?.find((c) => c.id === booking.carId);
                  const statusColors = {
                    completed: "bg-green-50 text-green-700",
                    ongoing: "bg-blue-50 text-blue-700",
                    cancelled: "bg-red-50 text-red-700",
                    upcoming: "bg-purple-50 text-purple-700",
                  };

                  return (
                    <div
                      key={booking.id}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="flex items-start gap-3 p-4 bg-[#F8F9FF] rounded-xl hover:bg-[#DBE3FF] cursor-pointer transition-all"
                    >
                      {car && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[#131A34]">
                            {car?.name || "Unknown Car"}
                          </p>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              statusColors[booking.status]
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#717685]">
                          {new Date(booking.createdDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold text-[#6679C0] mt-1">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(booking.total)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-[#717685] py-8">
                  No bookings yet
                </p>
              )}
            </div>
          </div>

          {/* Reviews for Owners */}
          {user.type === "owner" && reviews && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Reviews from Customers (
                {reviews.filter((r) => r.ownerId === user.id).length})
              </h2>
              <ReviewList
                reviews={reviews.filter((r) => r.ownerId === user.id)}
                itemsPerPage={10}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Account Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Status</span>
                <span
                  className={`font-semibold ${
                    (user.status === "normal" || user.status === "active")
                      ? "text-green-700"
                      : user.status === "suspended"
                        ? "text-yellow-700"
                        : "text-red-700"
                  }`}
                >
                  {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">License Verified</span>
                <span className="font-semibold text-[#131A34]">
                  {user.verified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Member Since</span>
                <span className="font-semibold text-[#131A34]">
                  {new Date(user.joinedDate).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Update - Only show for admin */}
          {canUpdateStatus && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Update Status
              </h2>

              {!showStatusUpdate ? (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="w-full px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
                >
                  Change User Status
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange("normal")}
                    disabled={user.status === "normal"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      user.status === "normal"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    Set as Normal
                  </button>
                  <button
                    onClick={() => handleStatusChange("stopped")}
                    disabled={user.status === "stopped"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      user.status === "stopped"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    Suspend Account
                  </button>
                  <button
                    onClick={() => handleStatusChange("banned")}
                    disabled={user.status === "banned"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      user.status === "banned"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    Ban User
                  </button>
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="w-full px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/bookings?userId=${user.id}`)}
                className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View All Bookings
              </button>
              {user.type === "owner" && (
                <button
                  onClick={() => navigate(`/cars?ownerId=${user.id}`)}
                  className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
                >
                  View Owner's Cars
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {canUpdateStatus && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title={`Change Status to ${newStatus}?`}
          message={`Are you sure you want to change this user's status to ${newStatus}? This action will affect their access to the platform.`}
          type="approve"
        />
      )}
    </div>
  );
}
