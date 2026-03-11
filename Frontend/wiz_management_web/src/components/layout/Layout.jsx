import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  FileText,
  LogOut,
  User,
  Calendar,
  Users,
  Car,
  UserCog,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getMenuItems } from "../../utils/permissions";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const iconMap = {
    Home: Home,
    FileText: FileText,
    Calendar: Calendar,
    Users: Users,
    Car: Car,
    UserCog: UserCog,
  };

  const menuItems = getMenuItems(user.type);

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <img
                src="/images/wiz_logo.png"
                alt="Wiz Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-[#131A34] font-bold text-lg">Wiz</h2>
              <p className="text-[#717685] text-sm">
                {isAdmin ? "Admin Portal" : "Support Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                  isActive(item.path)
                    ? "bg-[#6679C0] text-white shadow-lg shadow-[#6679C0]/30"
                    : "text-[#717685] hover:bg-[#F8F9FF]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-[#F8F9FF] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#6679C0] rounded-full flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#131A34]">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-[#717685]">
                  {isAdmin ? "Administrator" : "Customer Support"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 min-h-screen">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
