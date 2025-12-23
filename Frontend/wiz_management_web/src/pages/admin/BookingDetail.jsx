import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function BookingDetail({ bookingData, carData, userData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const booking = bookingData.find((b) => b.id === id);
  const car = booking ? carData.find((c) => c.id === booking.carId) : null;
  const user = booking ? userData.find((u) => u.id === booking.userId) : null;

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            Booking Not Found
          </h2>
          <p className="text-[#717685] mb-6">
            The booking you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/admin/bookings")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed",
      },
      ongoing: { bg: "bg-blue-50", text: "text-blue-700", label: "Ongoing" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
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

  const amount =
    typeof booking.amount === "string"
      ? booking.amount
      : new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(booking.amount);

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#131A34] mb-2">
              Booking Details
            </h1>
            <p className="text-[#717685]">Booking ID: {booking.id}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* car information */}
          {car && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Car Information
              </h2>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#131A34] mb-2">
                    {car.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#717685]">Type</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685]">Seater</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.seater}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685]">Fuel</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.fuelType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685]">Transmission</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.transmission}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/cars/${car.id}`)}
                    className="mt-4 text-[#6679C0] hover:text-[#131A34] font-semibold text-sm"
                  >
                    View Car Details →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* billing details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Billing Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Rental Price</span>
                <span className="font-semibold text-[#131A34]">
                  {car?.price || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Duration</span>
                <span className="font-semibold text-[#131A34]">2 Days</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-[#131A34]">Total Amount</span>
                <span className="font-bold text-[#6679C0] text-xl">
                  {amount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* renter information */}
          {user && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Renter Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Name</p>
                    <p className="font-semibold text-[#131A34]">{user.name}</p>
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
                <button
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  className="w-full mt-4 px-4 py-2 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
                >
                  View User Profile
                </button>
              </div>
            </div>
          )}
          {/* booking information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Booking Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#717685] mb-1">Booking Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#717685]" />
                  <p className="font-semibold text-[#131A34]">
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#717685] mb-1">Status</p>
                <p className="font-semibold text-[#131A34] capitalize">
                  {booking.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
