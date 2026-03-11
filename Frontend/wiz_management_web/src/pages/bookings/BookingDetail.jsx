import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useBookings, useUsers, useVehicles } from "../../hooks";
import defaultCar from "../../assets/car.png";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getBookingById } = useBookings();
  const { getUserById } = useUsers();
  const { getVehicleById } = useVehicles();

  const DEFAULT_CAR = {
    id: null,
    brand: "Unknown",
    model: "Unknown",
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

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const [car, setCar] = useState(DEFAULT_CAR);
  const [user, setUser] = useState(DEFAULT_USER);
  const [owner, setOwner] = useState(DEFAULT_USER);

  const [error, setError] = useState(null);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit",
      hour12: false, // 24-hour format
    });
  };

  // Load booking data
  useEffect(() => {
    loadBooking();
  }, [id]);

  useEffect(() => {
    if (!booking?.userId) return;

    const fetchUser = async () => {
      try {
        const userData = await getUserById(booking.userId);
        setUser(userData || DEFAULT_USER);
      } catch (err) {
        console.error("Failed to load user:", err);
        setUser(DEFAULT_USER);
      }
    };

    fetchUser();
  }, [booking?.userId]);

  useEffect(() => {
    if (!booking?.vehicleId) return;

    const fetchCar = async () => {
      try {
        const vehicleData = await getVehicleById(booking.vehicleId);
        setCar(vehicleData || DEFAULT_CAR);
      } catch (err) {
        console.error("Failed to load vehicle:", err);
        setCar(DEFAULT_CAR);
      }
    };

    fetchCar();
  }, [booking?.vehicleId]);

  useEffect(() => {
    if (!car?.ownerId) return;

    // Optimization: owner === renter
    // if (car.ownerId === booking?.ownerId) {
    //   setOwner(user);
    //   return;
    // }

    const fetchOwner = async () => {
      try {
        const ownerData = await getUserById(car.ownerId);
        setOwner(ownerData || DEFAULT_USER);
      } catch (err) {
        console.error("Failed to load owner:", err);
        setOwner(DEFAULT_USER);
      }
    };

    fetchOwner();
  }, [car?.ownerId]);

  const loadBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookingData = await getBookingById(id);
      setBooking(bookingData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load booking");
      console.error("Failed to load booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed",
      },
      completed_with_charge: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Completed with Charge",
      },
      picked_up: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "Picked Up",
      },
      returned_submitted: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "Returned Submitted",
      },
      dispute_opened: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Dispute Opened",
      },
      under_review: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Under Review",
      },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
      booking: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Booking",
      },
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Pending",
      },
      pending_payment: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Pending Payment",
      },
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#717685] font-semibold">Loading booking...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            {error || "Booking Not Found"}
          </h2>
          <p className="text-[#717685] mb-6">
            {error || "The booking you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/bookings")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

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
                    src={car?.image?.trim() ? car.image : defaultCar}
                    alt={car?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = defaultCar)}
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
                    onClick={() => navigate(`/cars/${car.id}`)}
                    className="text-[#6679C0] hover:text-[#131A34] font-semibold text-sm"
                  >
                    View Car Details
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
                  {/* {new Date(booking.createdAt).toLocaleDateString()} */}
                  {new Date(booking.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
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
                  {formatCurrency(booking.pricing.dailyRate || 0)}/day)
                </span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.pricing.rentalPrice || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Insurance Fee</span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.pricing.insuranceFee || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#717685]">Service Fee</span>
                <span className="font-semibold text-[#131A34]">
                  {formatCurrency(booking.pricing.serviceFee)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-[#131A34] text-lg">
                  Total Amount
                </span>
                <span className="font-bold text-[#6679C0] text-xl">
                  {formatCurrency(booking.pricing.totalPrice)}
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
                    {formatCurrency(booking.pricing.depositAmount)}
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
                    {formatCurrency(booking.pricing.remainingPayment)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* payment information */}
          {/* <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
          </div> */}
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
                    <p className="font-semibold text-sm text-[#131A34]">
                      {user.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#717685]">Email</p>
                    <p className="font-semibold text-sm text-[#131A34]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {/* <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-[#6679C0]" />
                  </div> */}
                  <div>
                    <p className="text-sm text-[#717685]">Phone no : </p>
                    <p className="font-semibold text-[#131A34]">{user.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/users/${user.id}`)}
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
                    <p className="font-semibold text-sm text-[#131A34]">
                      {owner.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/users/${owner.id}`)}
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
                onClick={() => navigate(`/bookings?userId=${booking.userId}`)}
                className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View User's Bookings
              </button>
              <button
                onClick={() => navigate(`/bookings?ownerId=${booking.ownerId}`)}
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
