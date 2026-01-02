import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  AlertCircle,
  Car,
  Package,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function RequestDetail({
  requests,
  onApprove,
  onDeny,
  bookingData,
  carData,
  userData,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const request = requests.find((r) => r.id === id);

  const [denialReason, setDenialReason] = useState("");
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Check if user can handle requests
  const canHandleRequests = hasPermission(user.type, 'HANDLE_REQUESTS');

  // Get related data
  const relatedBooking = request?.bookingId
    ? bookingData?.find((b) => b.id === request.bookingId)
    : null;
  const relatedVehicle = request?.vehicleId
    ? carData?.find((c) => c.id === request.vehicleId)
    : null;
  const relatedOwner = request?.ownerId
    ? userData?.find((u) => u.id === request.ownerId)
    : null;
  const requestCustomer = request?.customerId
    ? userData?.find((u) => u.id === request.customerId)
    : null;

  if (!request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            Request Not Found
          </h2>
          <p className="text-[#717685] mb-6">
            The request you're looking for doesn't exist
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

  const handleAction = (action) => {
    if (action === "approve") {
      setConfirmAction("approve");
      setShowConfirm(true);
    } else {
      if (!denialReason.trim()) {
        setShowDenialInput(true);
        return;
      }
      setConfirmAction("deny");
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === "approve") {
      onApprove(request.id);
    } else {
      onDeny(request.id, denialReason);
    }
    setShowConfirm(false);
    navigate("/requests");
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
    const badge = badges[status];
    return (
      <div
        className={`inline-flex items-center ${badge.bg} ${badge.text} px-4 py-2 rounded-xl font-semibold`}
      >
        {badge.label}
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      profile_update: "Cập nhật hồ sơ",
      vehicle_update: "Cập nhật xe",
      monthly_confirmation: "Xác nhận hàng tháng",
      booking_photos: "Upload ảnh booking",
      booking_issue: "Vấn đề booking",
      report_review: "Báo cáo đánh giá",
      account_deletion: "Xóa tài khoản",
      vehicle_deactivate: "Tạm ngưng xe",
      other: "Khác",
    };
    return labels[type] || type;
  };

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
              {request.title}
            </h1>
            <p className="text-[#717685]">
              Request ID: {request.id} • {getRequestTypeLabel(request.type)}
            </p>
          </div>
          {getStatusBadge(request.status)}
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
                {request.body}
              </p>
            </div>
          </div>

          {/* attached photos */}
          {request.photos && request.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attached Photos ({request.photos.length})
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
                      alt={`Attachment ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Booking Information */}
          {relatedBooking && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Related Booking
                </h2>
                <button
                  onClick={() => navigate(`/bookings/${relatedBooking.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Details
                </button>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Booking ID</span>
                  <span className="font-semibold text-[#131A34]">
                    {relatedBooking.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Total Cost</span>
                  <span className="font-semibold text-[#6679C0]">
                    {formatCurrency(relatedBooking.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Status</span>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      relatedBooking.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : relatedBooking.status === "ongoing"
                        ? "bg-blue-50 text-blue-700"
                        : relatedBooking.status === "cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {relatedBooking.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Duration</span>
                  <span className="font-semibold text-[#131A34]">
                    {relatedBooking.duration} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Related Vehicle Information */}
          {relatedVehicle && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Related Vehicle
                </h2>
                <button
                  onClick={() => navigate(`/cars/${relatedVehicle.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Details
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={relatedVehicle.image}
                    alt={relatedVehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-[#131A34]">
                    {relatedVehicle.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[#717685]">License Plate</p>
                      <p className="font-semibold text-[#131A34]">
                        {relatedVehicle.licensePlate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685]">Type</p>
                      <p className="font-semibold text-[#131A34]">
                        {relatedVehicle.vehicleType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Owner Information */}
          {relatedOwner && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34] flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Vehicle Owner
                </h2>
                <button
                  onClick={() => navigate(`/users/${relatedOwner.id}`)}
                  className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
                >
                  View Profile
                </button>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Name</span>
                  <span className="font-semibold text-[#131A34]">
                    {relatedOwner.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Email</span>
                  <span className="font-semibold text-[#131A34]">
                    {relatedOwner.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">Phone</span>
                  <span className="font-semibold text-[#131A34]">
                    {relatedOwner.phone}
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
                  <p className="font-semibold text-[#131A34]">
                    {request.handledBy || "N/A"}
                  </p>
                </div>
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Handled At</p>
                  <p className="font-semibold text-[#131A34]">
                    {request.handledAt
                      ? new Date(request.handledAt).toLocaleDateString()
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
          {showDenialInput && request.status === "pending" && canHandleRequests && (
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
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* customer info */}
          {requestCustomer && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131A34]">
                  Customer Information
                </h2>
                <button
                  onClick={() => navigate(`/users/${requestCustomer.id}`)}
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
                      {requestCustomer.name}
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
                      {requestCustomer.email}
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
                      {requestCustomer.phone}
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
                <p className="text-sm text-[#717685] mb-1">Category</p>
                <span className="inline-block bg-[#F8F9FF] text-[#6679C0] px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {request.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#717685] mb-1">Request Type</p>
                <span className="inline-block bg-[#DBE3FF] text-[#131A34] px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {getRequestTypeLabel(request.type)}
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
          {/* actions - Only show for pending requests and if user has permission */}
          {request.status === "pending" && canHandleRequests && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction("approve")}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#9AE8AB] text-[#131A34] rounded-xl font-semibold hover:bg-[#7dd89a] transition-all shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Request
                </button>
                <button
                  onClick={() => handleAction("deny")}
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