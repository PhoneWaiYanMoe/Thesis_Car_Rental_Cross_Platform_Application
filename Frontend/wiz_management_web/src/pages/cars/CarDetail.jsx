import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, MapPin, Settings, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ReviewList from "../../components/common/ReviewList";
import { useVehicles, useReviews } from "../../hooks";

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { getVehicleById, updateVehicleStatus } = useVehicles();
  const { getVehicleReviews } = useReviews();

  const [car, setCar] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const canUpdateStatus = hasPermission(user.type, "UPDATE_CAR_STATUS");

  // Load vehicle data
  useEffect(() => {
    loadVehicleData();
  }, [id]);

  const loadVehicleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch vehicle details
      const vehicleData = await getVehicleById(id);
      setCar(vehicleData);

      // Fetch reviews for this vehicle
      try {
        const { reviews: vehicleReviews } = await getVehicleReviews(id, 1, 10);
        setReviews(vehicleReviews || []);
      } catch (reviewError) {
        console.error("Failed to load reviews:", reviewError);
        // Continue even if reviews fail
        setReviews([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicle");
      console.error("Failed to load vehicle:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await updateVehicleStatus(car.id, newStatus);
      setCar({ ...car, status: newStatus });
      setShowConfirm(false);
      setShowStatusUpdate(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update vehicle status");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      stopped: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Stopped",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
    };
    const badge = badges[status] || badges.active;
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
          <p className="text-[#717685] font-semibold">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            {error || "Vehicle Not Found"}
          </h2>
          <p className="text-[#717685] mb-6">
            {error || "The vehicle you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/cars")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const carImages = car.images || [car.image];

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
          <div>
            <h1 className="text-3xl font-bold text-[#131A34] mb-2">
              {car.name}
            </h1>
            <p className="text-[#717685]">Vehicle ID: {car.id}</p>
          </div>
          {getStatusBadge(car.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Images */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-video bg-gray-200 relative group">
              <img
                src={carImages[currentImageIndex]}
                alt={car.name}
                className="w-full h-full object-cover"
              />

              {carImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? carImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="text-[#131A34] font-bold">‹</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === carImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="text-[#131A34] font-bold">›</span>
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {carImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-3">
                Description
              </h2>
              <p className="text-[#717685] leading-relaxed">
                {car.description}
              </p>
            </div>
          )}

          {/* Specifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Vehicle Type</p>
                <p className="font-semibold text-[#131A34] capitalize">
                  {car.vehicleType}
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Seater</p>
                <p className="font-semibold text-[#131A34]">
                  {car.seats || car.seater} Seater
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Fuel Type</p>
                <p className="font-semibold text-[#131A34] capitalize">
                  {car.fuelType}
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Transmission</p>
                <p className="font-semibold text-[#131A34] capitalize">
                  {car.transmission}
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Year</p>
                <p className="font-semibold text-[#131A34]">{car.year}</p>
              </div>
              {car.mileage && (
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Mileage</p>
                  <p className="font-semibold text-[#131A34]">
                    {car.mileage} km
                  </p>
                </div>
              )}
              {car.licensePlate && (
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">License Plate</p>
                  <p className="font-semibold text-[#131A34]">
                    {car.licensePlate}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="bg-[#F8F9FF] text-[#6679C0] px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Performance Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Performance
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {car.totalRentals || 0}
                </p>
                <p className="text-sm text-[#717685]">Total Rentals</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  ★ {parseFloat(car.rating || 0).toFixed(1)}
                </p>
                <p className="text-sm text-[#717685]">Rating</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {new Intl.NumberFormat("vi-VN").format(car.pricePerDay)} đ
                </p>
                <p className="text-sm text-[#717685]">Per Day</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">
                Customer Reviews ({reviews.length})
              </h2>
              <ReviewList reviews={reviews} itemsPerPage={10} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Owner Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#717685]">Name</p>
                  <p className="font-semibold text-[#131A34]">
                    {car.ownerName || "Unknown"}
                  </p>
                </div>
              </div>
              {car.locationDetails && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#6679C0]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#717685]">Location</p>
                    <p className="font-semibold text-[#131A34]">
                      {car.locationDetails.city || car.location}
                    </p>
                    {car.locationDetails.address && (
                      <p className="text-xs text-[#717685] mt-1">
                        {car.locationDetails.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {car.ownerId && (
                <button
                  onClick={() => navigate(`/users/${car.ownerId}`)}
                  className="w-full mt-2 px-4 py-2 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
                >
                  View Owner Profile
                </button>
              )}
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
                  Change Vehicle Status
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange("active")}
                    disabled={car.status === "active"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      car.status === "active"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    Set as Active
                  </button>
                  <button
                    onClick={() => handleStatusChange("stopped")}
                    disabled={car.status === "stopped"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      car.status === "stopped"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    Set as Stopped
                  </button>
                  <button
                    onClick={() => handleStatusChange("banned")}
                    disabled={car.status === "banned"}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      car.status === "banned"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    Ban This Vehicle
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
                onClick={() => navigate(`/bookings?vehicleId=${car.id}`)}
                className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View Booking History
              </button>
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
          message={`Are you sure you want to change this vehicle's status to ${newStatus}? This action will affect the vehicle's availability on the platform.`}
          type="approve"
        />
      )}
    </div>
  );
}
