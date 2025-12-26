import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  User,
  DollarSign,
  Calendar,
  MapPin,
  Settings,
  AlertCircle,
} from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function CarDetail({ carData, onUpdateCarStatus, userData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const car = carData.find((c) => c.id === id);

  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carImages = car ? [car.image, car.image, car.image] : [];

  // if (!car) {
  //   return (
  //     <div className="flex items-center justify-center h-96">
  //       <div className="text-center">
  //         <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
  //         <h2 className="text-2xl font-bold text-[#131A34] mb-2">
  //           Car Not Found
  //         </h2>
  //         <p className="text-[#717685] mb-6">
  //           The car you're looking for doesn't exist
  //         </p>
  //         <button
  //           onClick={() => navigate("/admin/cars")}
  //           className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
  //         >
  //           Back to Cars
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // <button
  //   onClick={() => {
  //     // If we came from a specific route (stored in location.state), go back there
  //     if (location.state?.from) {
  //       navigate(location.state.from);
  //     } else {
  //       navigate("/admin/cars");
  //     }
  //   }}
  //   className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
  // >
  //   <ArrowLeft className="w-5 h-5" />
  //   Back
  // </button>;

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onUpdateCarStatus(car.id, newStatus);
    setShowConfirm(false);
    setShowStatusUpdate(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Normal" },
      stopped: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Stopped",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
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

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        {/* <button
          onClick={() => navigate("/admin/cars")}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cars
        </button> */}
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
            <p className="text-[#717685]">Car ID: {car.id}</p>
          </div>
          {getStatusBadge(car.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* car images */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-video bg-gray-200 relative group">
              <img
                src={carImages[currentImageIndex]}
                alt={car.name}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              {carImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? carImages.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="text-[#131A34] font-bold">‹</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === carImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="text-[#131A34] font-bold">›</span>
                  </button>
                </>
              )}

              {/* Image Indicators */}
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

          {/* car specifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Vehicle Type</p>
                <p className="font-semibold text-[#131A34]">
                  {car.vehicleType}
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Seater</p>
                <p className="font-semibold text-[#131A34]">
                  {car.seater} Seater
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Fuel Type</p>
                <p className="font-semibold text-[#131A34]">{car.fuelType}</p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Transmission</p>
                <p className="font-semibold text-[#131A34]">
                  {car.transmission}
                </p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Year</p>
                <p className="font-semibold text-[#131A34]">{car.year}</p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Mileage</p>
                <p className="font-semibold text-[#131A34]">{car.mileage} km</p>
              </div>
            </div>
          </div>

          {/* features */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Features</h2>
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

          {/* performance stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Performance
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  {car.totalRentals}
                </p>
                <p className="text-sm text-[#717685]">Total Rentals</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  ★ {parseFloat(car.rating).toFixed(1)}
                </p>
                <p className="text-sm text-[#717685]">Rating</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">
                  ${car.price}
                </p>
                <p className="text-sm text-[#717685]">Per Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* owner info */}
          {/* owner info */}
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
                    {car.ownerName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#717685]">Location</p>
                  <p className="font-semibold text-[#131A34]">{car.location}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const owner = userData?.find((u) => u.name === car.ownerName);
                  if (owner) navigate(`/admin/users/${owner.id}`);
                }}
                className="w-full mt-2 px-4 py-2 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                View Owner Profile
              </button>
            </div>
          </div>

          {/* pricing info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Daily Rate</span>
                <span className="font-bold text-[#131A34]">${car.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Insurance</span>
                <span className="font-semibold text-[#131A34]">
                  {car.insuranceType}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[#717685]">Availability</span>
                <span className="text-sm font-semibold text-[#6679C0]">
                  {car.availability}
                </span>
              </div>
            </div>
          </div>

          {/* status update */}
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
                Change Car Status
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleStatusChange("normal")}
                  disabled={car.status === "normal"}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    car.status === "normal"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  Set as Normal
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
                  Ban This Car
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
        </div>
      </div>

      {/* confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`Change Status to ${newStatus}?`}
        message={`Are you sure you want to change this car's status to ${newStatus}? This action will affect the car's availability on the platform.`}
        type="approve"
      />
    </div>
  );
}
