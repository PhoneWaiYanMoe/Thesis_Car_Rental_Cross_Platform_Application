import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronDown,
  Car as CarIcon,
  ArrowLeft,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import CarCard from "../../components/common/CarCard";
import { useVehicles } from "../../hooks";

export default function CarManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId");
  const sortByParam = searchParams.get("sortBy");

  const { vehicles, loading, error, fetchVehicles } = useVehicles();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("name"); // name, id, ownerId, licensePlate
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState(sortByParam || "name");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const vehicleTypes = ["all", "sedan", "suv", "hatchback", "truck", "van"];

  // Load data from API
  useEffect(() => {
    loadVehicles();
  }, [currentPage, filterStatus, filterType, ownerId]);

  const loadVehicles = async () => {
    try {
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterType !== "all") filters.vehicleType = filterType;
      // if (ownerId) filters.ownerId = ownerId;
      if (searchTerm && searchBy) {
        filters.search = searchTerm;
        filters.searchBy = searchBy;
      }

      await fetchVehicles(filters);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadVehicles();
  };

  // Client-side sorting
  let displayVehicles = [...vehicles];
  displayVehicles = displayVehicles.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "rentals":
        return b.totalRentals - a.totalRentals;
      case "rating":
        return parseFloat(b.rating) - parseFloat(a.rating);
      case "price":
        return b.pricePerDay - a.pricePerDay;
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: vehicles.length,
    active: vehicles.filter((c) => c.status === "active").length,
    stopped: vehicles.filter((c) => c.status === "stopped").length,
    banned: vehicles.filter((c) => c.status === "banned").length,
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, filterType, sortBy, ownerId]);

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
            : "Manage all vehicles on the platform"}
        </p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Cars" },
          { id: "active", label: "Active" },
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
            {filterStatus === tab.id && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                {tab.id === "" ? statusCounts.all : statusCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* search and filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* search */}
          <div className="flex-1 flex gap-2">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-medium text-[#131A34]"
            >
              <option value="name">Name or License Plate</option>
              <option value="vehicleId">ID</option>
              <option value="ownerId">Owner ID</option>
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder={`Search by ${searchBy}...`}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
            >
              Search
            </button>
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
            <option value="price">Sort by Price</option>
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
            {displayVehicles.length}
          </span>{" "}
          cars
        </p>
        {(searchTerm || filterStatus !== "all" || filterType !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterType("all");
              setSearchBy("name");
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#717685] font-semibold">Loading vehicles...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadVehicles}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* car grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVehicles.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100">
              <CarIcon className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
              <p className="text-[#717685] text-lg font-medium">
                No cars found
              </p>
              <p className="text-[#B2BCE0] text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            displayVehicles.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                showOwner={true}
                onClickPath={`/cars/${car.id}`}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && displayVehicles.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-[#717685] font-medium">
            Page {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={displayVehicles.length < itemsPerPage}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
