import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  User,
  DollarSign,
  MapPin,
  AlertCircle,
} from "lucide-react";
import ReviewList from "../../components/ReviewList";

export default function VehicleDetail({ carData, userData, reviewData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const car = carData.find((c) => c.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carImages = car ? car.images || [car.image] : [];

  if (!car) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            Vehicle Not Found
          </h2>
          <p className="text-[#717685] mb-6">
            The vehicle you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/support/vehicles")}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

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
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">Color</p>
                <p className="font-semibold text-[#131A34]">{car.color}</p>
              </div>
              <div className="bg-[#F8F9FF] rounded-xl p-4">
                <p className="text-sm text-[#717685] mb-1">License Plate</p>
                <p className="font-semibold text-[#131A34]">
                  {car.licensePlate}
                </p>
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

          {/* description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Description
            </h2>
            <p className="text-[#131A34] leading-relaxed">{car.description}</p>
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
                  {new Intl.NumberFormat("vi-VN").format(car.pricePerDay)} đ
                </p>
                <p className="text-sm text-[#717685]">Per Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
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
                  if (owner) navigate(`/support/users/${owner.id}`);
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
                <span className="font-bold text-[#131A34]">
                  {new Intl.NumberFormat("vi-VN").format(car.pricePerDay)} đ
                </span>
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
        </div>
      </div>

      {/* Reviews Section */}
      {reviewData && (
        <div className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">
              Đánh giá từ khách hàng (
              {reviewData.filter((r) => r.carId === car.id).length})
            </h2>
            <ReviewList
              reviews={reviewData.filter((r) => r.carId === car.id)}
              itemsPerPage={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}
