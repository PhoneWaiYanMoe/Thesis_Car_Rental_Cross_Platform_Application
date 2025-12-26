import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
  CreditCard,
} from "lucide-react";

export default function BookingDetail({ bookingData, carData, userData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const booking = bookingData.find((b) => b.id === id);
  const car = booking ? carData.find((c) => c.id === booking.carId) : null;
  const user = booking ? userData.find((u) => u.id === booking.userId) : null;
  const owner = booking ? userData.find((u) => u.id === booking.ownerId) : null;

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
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Go Back
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
      upcoming: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Upcoming",
      },
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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
                    onClick={() =>
                      navigate(`/admin/cars/${car.id}`, {
                        state: { from: location.pathname },
                      })
                    }
                    className="text-[#6679C0] hover:text-[#131A34] font-semibold text-sm"
                  >
                    View Car Details →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* rental period */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Rental Period
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Start Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6679C0]" />
                  <p className="font-semibold text-[#131A34]">
                    {formatDate(booking.startDate)}
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">End Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6679C0]" />
                  <p className="font-semibold text-[#131A34]">
                    {formatDate(booking.endDate)}
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Duration</p>
                <p className="font-semibold text-[#131A34]">
                  {booking.duration} days
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Booking Date</p>
                <p className="font-semibold text-[#131A34]">
                  {new Date(booking.createdDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* location details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Pickup Location</p>
                  <p className="font-semibold text-[#131A34]">
                    {booking.pickupLocation}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Dropoff Location</p>
                  <p className="font-semibold text-[#131A34]">
                    {booking.dropoffLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* billing details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Billing Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">
                  Rental Price ({booking.duration} days ×{" "}
                  {formatCurrency(car?.pricePerDay || 0)}/day)
                </span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.rentalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Insurance Fee</span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.insuranceFee)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Service Fee</span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.serviceFee)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-[#131A34] text-lg">
                  Total Amount
                </span>
                <span className="font-bold text-[#6679C0] text-xl">
                  {formatCurrency(booking.total)}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">
                    Deposit (30%){" "}
                    {booking.depositPaid && (
                      <span className="text-green-600 text-xs ml-2">
                        ✓ Paid
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-[#131A34]">
                    {formatCurrency(booking.deposit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#717685]">
                    Remaining{" "}
                    {booking.remainingPaid && (
                      <span className="text-green-600 text-xs ml-2">
                        ✓ Paid
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-[#131A34]">
                    {formatCurrency(booking.remaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* payment information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Payment Information
            </h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <p className="text-sm text-[#717685]">Payment Method</p>
                <p className="font-semibold text-[#131A34]">
                  {booking.paymentMethod}
                </p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-semibold">
                  Note: {booking.notes}
                </p>
              </div>
            )}
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
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">License Number</p>
                    <p className="font-semibold text-[#131A34]">
                      {booking.userLicense}
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

          {/* owner information */}
          {owner && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Car Owner
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Name</p>
                    <p className="font-semibold text-[#131A34]">{owner.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/users/${owner.id}`)}
                  className="w-full mt-2 px-4 py-2 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
                >
                  View Owner Profile
                </button>
              </div>
            </div>
          )}

          {/* quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate(`/admin/bookings?userId=${booking.userId}`)
                }
                className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View User's Bookings
              </button>
              <button
                onClick={() =>
                  navigate(`/admin/bookings?ownerId=${booking.ownerId}`)
                }
                className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View Owner's Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
