import { useNavigate } from "react-router-dom";
import defaultCar from "../../assets/Car.png";

export default function CarCard({ car, showOwner = true, onClickPath = null }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      stopped: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Stopped",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
      deactivated: {
        bg: "bg-red-50",
        text: "text-red-700",
        label: "Deactivated",
      },
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Pending",
      },
    };
    return badges[status];
  };

  const badge = getStatusBadge(car.status);
  const path = onClickPath || `/admin/cars/${car.id}`;

  return (
    <div
      onClick={() => navigate(path)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="aspect-video bg-gray-200 overflow-hidden">

        <img
          src={car.primaryPhoto?.trim() ? car.primaryPhoto : defaultCar}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => (e.target.src = defaultCar)}
        />

      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-[#131A34] group-hover:text-[#6679C0] transition-colors mb-1">
              {car.name}
            </h3>
            {showOwner && (
              <p className="text-xs text-[#717685]">{car.ownerId}</p>
            )}
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
            <p className="font-semibold text-[#131A34]">{car.vehicleType}</p>
          </div>
          <div>
            <p className="text-[#717685] text-xs">Seater</p>
            <p className="font-semibold text-[#131A34]">{car.seater}</p>
          </div>
          <div>
            <p className="text-[#717685] text-xs">Fuel</p>
            <p className="font-semibold text-[#131A34]">{car.fuelType}</p>
          </div>
          <div>
            <p className="text-[#717685] text-xs">Transmission</p>
            <p className="font-semibold text-[#131A34]">{car.transmission}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-[#717685]">Price per day</p>
            <p className="font-bold text-[#6679C0]">
              {new Intl.NumberFormat("vi-VN").format(car.pricePerDay)} đ
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
            <p className="font-bold text-[#131A34]">{car.totalRentals}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
