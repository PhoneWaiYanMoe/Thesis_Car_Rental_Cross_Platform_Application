import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Car, UserCog, LogOut, Shield } from "lucide-react";

export default function AdminLayout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: Car, label: "Cars", path: "/admin/cars" },
    { icon: UserCog, label: "Support Staff", path: "/admin/staff" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      {/* sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 z-50">
        {/* logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6679C0] rounded-xl flex items-center justify-center">
              <img
                src="/images/wiz_logo.png"
                alt="Wiz Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h2 className="text-[#131A34] font-bold text-lg">Wiz</h2>
              <p className="text-[#717685] text-sm">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                isActive(item.path)
                  ? "bg-[#6679C0] text-white shadow-lg shadow-[#6679C0]/30"
                  : "text-[#717685] hover:bg-[#F8F9FF]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* user info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-[#F8F9FF] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#6679C0] rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#131A34]">
                  {user?.username || "Admin"}
                </p>
                <p className="text-xs text-[#717685]">Administrator</p>
              </div>
            </div>
          </div>

          {/* Quick link to support view */}
          <div className="px-4 pb-3">
            <button
              onClick={() => navigate("/support/dashboard")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#6679C0] hover:bg-[#F8F9FF] rounded-xl transition-all font-medium text-sm"
            >
              View Support Dashboard →
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* main content */}
      <div className="ml-72 min-h-screen">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
