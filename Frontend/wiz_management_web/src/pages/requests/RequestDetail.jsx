import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  Mail,
  Phone,
  AlertCircle,
  Calendar,
  Package,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRequests, useBookings, useUsers, useVehicles } from "../../hooks";
import { hasPermission } from "../../utils/permissions";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { getRequestById, approveRequest, denyRequest, addNote } =
    useRequests();
  const { getBookingById } = useBookings();
  const { getUserById } = useUsers();
  const { getVehicleById } = useVehicles();
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const canHandleRequests =
    hasPermission(user.type, "HANDLE_REQUESTS") ||
    hasPermission(user.type, "VIEW_ALL_STAFF_REQUESTS");

  const DEFAULT_CAR = {
    id: null,
    name: "Unknown Vehicle",
    brand: "Unknown",
    model: "Unknown",
    licensePlate: "-",
    type: "-",
    year: "-",
    pricePerDay: 0,
    imageUrl: "/placeholder-car.png",
  };

  const DEFAULT_USER = {
    id: null,
    name: "Guest",
    email: "-",
    phone: "-",
  };

  const DEFAULT_BOOKING = {
    id: null,
    total: 0,
    status: "unknown",
    duration: 0,
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [booking, setBooking] = useState(DEFAULT_BOOKING);
  const [car, setCar] = useState(DEFAULT_CAR);
  const [requester, setRequester] = useState(DEFAULT_USER);
  const [owner, setOwner] = useState(DEFAULT_USER);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load request data
  useEffect(() => {
    loadRequest();
  }, [id]);

  useEffect(() => {
    if (!request?.userId) return;

    const fetchUser = async () => {
      try {
        const requesterData = await getUserById(request.userId);
        setRequester(requesterData || DEFAULT_USER);
      } catch (err) {
        console.error("Failed to load user:", err);
        setRequester(DEFAULT_USER);
      }
    };

    fetchUser();
  }, [request?.userId]);

  useEffect(() => {
    if (!request?.vehicleId) return;

    const fetchCar = async () => {
      try {
        const vehicleData = await getVehicleById(request.vehicleId);
        setCar(vehicleData || DEFAULT_CAR);
      } catch (err) {
        console.error("Failed to load vehicle:", err);
        setCar(DEFAULT_CAR);
      }
    };

    fetchCar();
  }, [request?.vehicleId]);

  useEffect(() => {
    if (!request?.bookingId) return;

    const fetchBooking = async () => {
      try {
        const bookingData = await getBookingById(request.bookingId);
        setBooking(bookingData || DEFAULT_BOOKING);
      } catch (err) {
        console.error("Failed to load booking:", err);
        setBooking(DEFAULT_BOOKING);
      }
    };

    fetchBooking();
  }, [request?.bookingId]);

  useEffect(() => {
    if (!request?.ownerId) return;

    const fetchOwner = async () => {
      try {
        const ownerData = await getUserById(request.ownerId);
        setOwner(ownerData || DEFAULT_USER);
      } catch (err) {
        console.error("Failed to load owner:", err);
        setOwner(DEFAULT_USER);
      }
    };

    fetchOwner();
  }, [request?.ownerId]);

  const loadRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData = await getRequestById(id);
      setRequest(requestData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load request");
      console.error("Failed to load request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = () => {
    setConfirmAction("approve");
    setShowConfirm(true);
  };

  const handleDenyClick = () => {
    setConfirmAction("deny");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (confirmAction === "approve") {
        await approveRequest(id, user.username || user.email);
      } else if (confirmAction === "deny") {
        await denyRequest(id, user.username || user.email);
      }
      setShowConfirm(false);
      await loadRequest(); // Reload to show updated data
    } catch (err) {
      console.error("Failed to update request:", err);
      alert("Failed to update request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      await addNote(id, newNote);
      setNewNote("");
      setShowNoteInput(false);
      await loadRequest(); // Reload to show new note
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      note_added: "Note Added",
      request_paused: "Request Paused",
      request_resumed: "Request Resumed",
      request_approved: "Request Approved",
      request_denied: "Request Denied",
      request_created: "Request Created",
      status_updated: "Status Updated",
    };
    return (
      labels[action] ||
      action
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
  };

  const getActionColor = (action) => {
    switch (action) {
      case "request_paused":
        return {
          text: "text-yellow-700",
        };
      case "request_resumed":
      case "request_approved":
        return {
          text: "text-green-700",
        };
      case "request_denied":
        return {
          text: "text-red-700",
        };
      default:
        return {
          text: "text-gray-700",
        };
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
    const badge = badges[status] || badges.pending;
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
          <p className="text-[#717685] font-semibold">Loading request...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            {error || "Request Not Found"}
          </h2>
          <p className="text-[#717685] mb-6">
            {error || "The request you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/requests")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const canHandleRequest = request.status === "pending";

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/requests")}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Requests
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#131A34] mb-2">
              {request?.title}
            </h1>
            <p className="text-[#717685]">
              Request ID: {request?.id} • {request?.category}
            </p>
          </div>
          {getStatusBadge(request?.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* request details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Request Details
            </h2>
            <div className="bg-[#F8F9FF] rounded-xl p-6">
              <p className="text-[#131A34] leading-relaxed whitespace-pre-wrap">
                {request?.description}
              </p>
            </div>
          </div>

          {/* attached photos */}
          {request.photos && request.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attached Photos ({request?.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {request.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(photo)}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all border-2 border-gray-100 hover:border-[#6679C0]"
                  >
                    <img
                      src={photo}
                      alt={`Attachment ${idx + 1}, ${photo}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Booking Information */}
          {booking?.id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Related Booking
                </h2>
                <button
                  onClick={() => navigate(`/bookings/${booking?.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Details
                </button>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Booking ID</span>
                  <span className="font-semibold text-[#131A34]">
                    {booking?.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Total Cost</span>
                  <span className="font-semibold text-[#6679C0]">
                    {formatCurrency(booking?.pricing.totalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Status</span>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      booking?.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : booking?.status === "picked_up"
                          ? "bg-blue-50 text-blue-700"
                          : booking?.status === "cancelled"
                            ? "bg-red-50 text-red-700"
                            : booking?.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : booking?.status === "pending_payment"
                                ? "bg-yellow-50 text-yellow-700"
                                : booking?.status === "picked_up"
                                  ? "bg-green-50 text-green-700"
                                  : booking?.status === "booking"
                                    ? "bg-purple-50 text-purple-700"
                                    : booking?.status === "dispute_opened"
                                      ? "bg-red-50 text-red-700"
                                      : booking?.status === "under_review"
                                        ? "bg-purple-50 text-purple-700"
                                        : booking?.status === "return_submitted"
                                          ? "bg-purple-50 text-purple-700"
                                          : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {booking?.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Duration</span>
                  <span className="font-semibold text-[#131A34]">
                    {booking?.duration} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Related Vehicle Information */}
          {car?.id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Related Vehicle
                </h2>
                <button
                  onClick={() => navigate(`/cars/${car?.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Details
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={car?.image}
                    alt={car?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-[#131A34]">{car?.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[#717685]">License Plate</p>
                      <p className="font-semibold text-[#131A34]">
                        {car?.licensePlate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685]">Type</p>
                      <p className="font-semibold text-[#131A34]">
                        {car?.vehicleType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Owner Information */}
          {owner?.id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Vehicle Owner
                </h2>
                <button
                  onClick={() => navigate(`/users/${owner?.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Profile
                </button>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Name</span>
                  <span className="font-semibold text-[#131A34]">
                    {owner?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Email</span>
                  <span className="font-semibold text-[#131A34]">
                    {owner?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Phone</span>
                  <span className="font-semibold text-[#131A34]">
                    {owner?.phone}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* handler info */}
          {request.status !== "pending" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Handling Information
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Handled By</p>
                  <p className="font-semibold text-xs text-[#131A34]">
                    {request.handledById || "N/A"}
                  </p>
                </div>
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Handled At</p>
                  <p className="font-semibold text-[#131A34]">
                    {request.handledAt
                      ? new Date(request?.handledAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              {request.denialReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 mb-2 font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Denial Reason
                  </p>
                  <p className="text-red-900">{request.denialReason}</p>
                </div>
              )}
            </div>
          )}

          {/* denial input */}
          {showDenialInput &&
            request.status === "pending" &&
            canHandleRequests && (
              <div className="bg-white rounded-2xl border border-red-200 p-6">
                <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Denial Reason Required
                </h2>
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full px-4 py-3 border border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  rows="5"
                  placeholder="Please provide a clear explanation for denying this request. This message will be sent to the customer."
                />
              </div>
            )}

          {/* Notes */}
          {request.notes && request.notes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Notes ({request.notes.length})
              </h2>
              <div className="space-y-4">
                {request.notes.map((note, idx) => (
                  <div key={idx} className="bg-[#F8F9FF] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-[#131A34]">
                        {note.author || "Staff"}
                      </p>
                      <p className="text-xs text-[#717685]">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-[#131A34]">
                      {note.note || note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Note Section */}
          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full px-6 py-3 border-2 border-dashed border-gray-300 text-[#717685] rounded-xl font-semibold hover:border-[#6679C0] hover:text-[#6679C0] transition-all"
            >
              + Add Note
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-[#131A34] mb-3">Add Note</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none resize-none"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || submitting}
                  className="px-6 py-2 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save Note"}
                </button>
                <button
                  onClick={() => {
                    setShowNoteInput(false);
                    setNewNote("");
                  }}
                  className="px-6 py-2 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* customer info */}
          {requester?.id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34]">
                  Customer Information
                </h2>
                <button
                  onClick={() => navigate(`/users/${requester?.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Profile
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Name</p>
                    <p className="font-semibold text-[#131A34]">
                      {requester?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Email</p>
                    <p className="font-semibold text-[#131A34] break-all">
                      {requester?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Phone</p>
                    <p className="font-semibold text-[#131A34]">
                      {requester?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* request info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Request Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#717685] mb-1">Priority</p>
                <span className="inline-block bg-[#DBE3FF] text-[#131A34] px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {request.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#717685] mb-1">Category</p>

                <span className="inline-block bg-[#F8F9FF] text-[#6679C0] px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {request.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#717685] mb-1">Created At</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#717685]" />
                  <p className="font-semibold text-[#131A34]">
                    {new Date(request.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action History */}
          {request.actions && request.actions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Action History ({request.actions.length})
                </h2>
              </div>

              <div className="space-y-3">
                {/* Display actions - show 2 by default, all when expanded */}
                {(showAllActions
                  ? request.actions
                  : request.actions.slice(0, 2)
                ).map((action, idx) => {
                  const colors = getActionColor(action.action);
                  return (
                    <div
                      key={action.id || idx}
                      className={`bg-gray-50 border ${colors.border} rounded-xl p-4 transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`font-semibold text-sm ${colors.text}`}>
                              {getActionLabel(action.action)}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(action.created_at).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          {action.notes && (
                            <p className="text-xs text-gray-700 mt-1">
                              Note : {action.notes}
                            </p>
                          )}
                          {action.performed_by && (
                            <p className="text-[10px] text-gray-500 mt-2">
                              By: {action.performed_by}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show More/Less Button */}
                {request.actions.length > 2 && (
                  <button
                    onClick={() => setShowAllActions(!showAllActions)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-[#6679C0] rounded-xl font-semibold hover:border-[#6679C0] hover:bg-[#F8F9FF] transition-all flex items-center justify-center gap-2"
                  >
                    {showAllActions ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        Show All {request.actions.length} Actions
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* actions - Show for pending requests if user has permission */}
          {request.status === "pending" && canHandleRequests && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleApproveClick()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#9AE8AB] text-[#131A34] rounded-xl font-semibold hover:bg-[#7dd89a] transition-all shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Request
                </button>
                <button
                  onClick={() => handleDenyClick()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F95E5B] text-white rounded-xl font-semibold hover:bg-[#f73d39] transition-all shadow-lg hover:shadow-xl"
                >
                  <XCircle className="w-5 h-5" />
                  Deny Request
                </button>
              </div>
              <p className="text-xs text-[#717685] mt-4 text-center">
                This action cannot be undone
              </p>
            </div>
          )}
        </div>
      </div>

      {/* image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* confirmation dialog */}
      {canHandleRequests && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title={
            confirmAction === "approve" ? "Approve Request?" : "Deny Request?"
          }
          message={
            confirmAction === "approve"
              ? "Are you sure you want to approve this request? This action cannot be undone."
              : "Are you sure you want to deny this request? The customer will receive your explanation."
          }
          type={confirmAction}
        />
      )}
    </div>
  );
}
