import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

export default function UserCard({ user, basePath = "/admin/users" }) {
  const navigate = useNavigate();

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

  const badge = getStatusBadge(user.status);

  return (
    <div
      onClick={() => navigate(`${basePath}/${user.id}`)}
      className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-[#6679C0] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                {user.name}
              </h4>
              <span
                className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
              >
                {badge.label}
              </span>
              <span className="bg-[#F8F9FF] text-[#6679C0] px-2.5 py-1 rounded-lg text-xs font-semibold">
                {user.type === "renter" ? "Renter" : "Car Owner"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#717685]">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.id}</span>
              <span>•</span>
              <span>
                Joined {new Date(user.joinedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-sm text-[#717685]">Bookings</p>
            <p className="font-bold text-[#131A34]">{user.totalBookings}</p>
          </div>
          {user.type === "owner" && (
            <div>
              <p className="text-sm text-[#717685]">Cars</p>
              <p className="font-bold text-[#131A34]">{user.totalCars || 0}</p>
            </div>
          )}
          <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
        </div>
      </div>
    </div>
  );
}
