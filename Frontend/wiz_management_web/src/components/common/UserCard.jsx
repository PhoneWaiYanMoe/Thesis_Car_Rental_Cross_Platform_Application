import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

export default function UserCard({ user, basePath = "/admin/users" }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Normal" },
      active: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      suspended: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Suspended",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
      deleted: { bg: "bg-red-50", text: "text-red-700", label: "Deleted" },
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
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#6679C0] flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
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
                {user.type === "customer" ? "Customer" : "Car Owner"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#717685]">
              <span>{user.email}</span>
              <span>•</span>
              <span className="text-xs">{user.id}</span>
              <span>•</span>
              <span>
                Joined{" "}
                {/* {new Date(user.joinedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} */}
                {new Date(user.joinedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {/* <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-sm text-[#717685]">Bookings</p>
            <p className="font-bold text-[#131A34]">{user.totalBookings}</p>
          </div>
          {user.type === "owner" && (
            <div>
              <p className="text-sm text-[#717685]">Rentals</p>
              <p className="font-bold text-[#131A34]">{user.totalRentals || 0}</p>
            </div>
          )}
          <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
        </div> */}
      </div>
    </div>
  );
}
