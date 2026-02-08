import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

export default function BookingCard({ booking, basePath = "/admin/bookings" }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      pending_payment: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending Payment" },
      pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending" },
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed",
      },
      completed_with_charge: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed With Charge",
      },
      picked_up: { bg: "bg-blue-50", text: "text-blue-700", label: "Ongoing" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
      booking: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Booking",
      },
      under_review: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Under Review",
      },
      return_submitted: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Return Submitted",
      },
      dispute_opened: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Dispute Opened",
      },
    };
    return badges[status];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const badge = getStatusBadge(booking.status);

  return (
    <div
      onClick={() => navigate(`${basePath}/${booking.id}`)}
      className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src="/images/wiz_logo.png"
              alt={booking.carName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                {booking.carName}
              </h4>
              <span
                className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
              >
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#717685] flex-wrap">
              <span></span>
              <span className="font-medium text-xs">Booking ID : {booking.id}</span>
              <span></span>
              <span className="text-xs">{new Date(booking.startDate).toLocaleDateString()}</span>

              <span className="basis-full h-0"></span>
              <span></span>
              <span className="text-xs">Customer ID : {booking.userId}</span>
              <span></span>
              <span className="text-xs">{booking.duration} days</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-sm text-[#717685]">Total</p>
            <p className="font-bold text-[#6679C0]">
              {formatCurrency(booking.total)}
            </p>
          </div>
          <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
        </div>
      </div>
    </div>
  );
}
