import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Eye, ChevronDown, Car as CarIcon, ArrowLeft } from "lucide-react";

export default function VehicleManagement({ carData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const vehicleTypes = ["all", ...new Set(carData.map((c) => c.vehicleType))];

  let filteredCars = carData;

  // Apply owner filter if provided in URL
  if (ownerId) {
    filteredCars = filteredCars.filter((car) => car.ownerId === ownerId);
  }

  // Then apply other filters
  filteredCars = filteredCars.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || car.status === filterStatus;
    const matchesType = filterType === "all" || car.vehicleType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // sort
  filteredCars = [...filteredCars].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "rentals":
        return b.totalRentals - a.totalRentals;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

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
    return badges[status];
  };

  const statusCounts = {
    all: carData.length,
    normal: carData.filter((c) => c.status === "normal").length,
    stopped: carData.filter((c) => c.status === "stopped").length,
    banned: carData.filter((c) => c.status === "banned").length,
  };

  return (
    <div>
      {/* Back button if filtered by owner */}
      {ownerId && (
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      )}

      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">
          {ownerId ? "Owner's Vehicles" : "Vehicles"}
        </h1>
        <p className="text-[#717685]">
          {ownerId
            ? "Showing vehicles owned by this user"
            : "View all vehicles on the platform"}
        </p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Vehicles" },
          { id: "normal", label: "Normal" },
          { id: "stopped", label: "Stopped" },
          { id: "banned", label: "Banned" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filterStatus === tab.id
                ? "bg-[#6679C0] text-white shadow-lg"
                : "text-[#717685] hover:bg-[#F8F9FF]"
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterStatus === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-[#717685]"
              }`}
            >
              {statusCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* search and filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by car name, owner, or ID..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
            />
          </div>

          {/* filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-[#F8F9FF] transition-all font-semibold text-[#131A34]"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="name">Sort by Name</option>
            <option value="rentals">Sort by Rentals</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {/* advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">
                Vehicle Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing{" "}
          <span className="font-semibold text-[#131A34]">
            {filteredCars.length}
          </span>{" "}
          vehicles
        </p>
        {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterType("all");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* car grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100">
            <CarIcon className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
            <p className="text-[#717685] text-lg font-medium">
              No vehicles found
            </p>
            <p className="text-[#B2BCE0] text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          filteredCars.map((car) => {
            const badge = getStatusBadge(car.status);
            return (
              <div
                key={car.id}
                onClick={() => navigate(`/support/vehicles/${car.id}`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#131A34] group-hover:text-[#6679C0] transition-colors mb-1">
                        {car.name}
                      </h3>
                      <p className="text-sm text-[#717685]">{car.ownerName}</p>
                    </div>
                    <span
                      className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-[#717685] text-xs">Type</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685] text-xs">Seater</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.seater}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685] text-xs">Fuel</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.fuelType}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#717685] text-xs">Transmission</p>
                      <p className="font-semibold text-[#131A34]">
                        {car.transmission}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-[#717685]">Price per day</p>
                      <p className="font-bold text-[#6679C0]">
                        {new Intl.NumberFormat("vi-VN").format(car.pricePerDay)}{" "}
                        đ
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#717685]">Rating</p>
                      <p className="font-bold text-[#131A34]">
                        ★ {parseFloat(car.rating).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#717685]">Rentals</p>
                      <p className="font-bold text-[#131A34]">
                        {car.totalRentals}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
