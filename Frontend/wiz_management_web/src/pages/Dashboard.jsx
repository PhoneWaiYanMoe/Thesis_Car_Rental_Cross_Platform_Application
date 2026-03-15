import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAdminDashboard } from "../hooks/useApi";
import {
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Eye,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../components/common/StatCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isSupport } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch analytics data from backend
  const { data: analyticsData, loading, error } = useAdminDashboard(timeRange);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6679C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#717685] font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-[#717685] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Support Staff Dashboard
  if (isSupport) {
    const requestStats = analyticsData?.requests || {};

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">Dashboard</h1>
          <p className="text-[#717685]">
            Welcome back, {user.name || user.username}!
          </p>
        </div>

        {/* Time Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-[#6679C0]" />
            <h3 className="font-semibold text-[#131A34]">Time Period</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "90d", label: "Last 90 Days" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeRange(filter.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === filter.id
                    ? "bg-[#6679C0] text-white"
                    : "bg-gray-100 text-[#717685] hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Clock}
            label="Pending Requests"
            value={requestStats.pending || 0}
            bgColor="#FEF3C7"
          />
          <StatCard
            icon={CheckCircle}
            label="Approved"
            value={requestStats.approved || 0}
            bgColor="#D1FAE5"
          />
          <StatCard
            icon={XCircle}
            label="Denied"
            value={requestStats.denied || 0}
            bgColor="#FEE2E2"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Handled"
            value={requestStats.total || 0}
            bgColor="#E0E7FF"
          />
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#131A34]">
              Recent Requests
            </h3>
            <button
              onClick={() => navigate("/requests")}
              className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold flex items-center gap-1"
            >
              View All
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-[#717685] text-center">
              View all requests in the{" "}
              <button
                onClick={() => navigate("/requests")}
                className="text-[#6679C0] font-semibold hover:underline"
              >
                Requests page
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    const bookingStats = analyticsData?.bookings || {};
    const userStats = analyticsData?.users || {};
    const vehicleStats = analyticsData?.vehicles || {};
    const revenueStats = analyticsData?.revenue || {};
    const requestStats = analyticsData?.requests || {};

    // Prepare revenue trend data for chart
    const revenueTrend = revenueStats.trend || [];

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">Dashboard</h1>
          <p className="text-[#717685]">
            Welcome back, {user.name || user.username}!
          </p>
        </div>

        {/* Time Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-[#6679C0]" />
            <h3 className="font-semibold text-[#131A34]">Time Period</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "90d", label: "Last 90 Days" },
              { id: "1y", label: "Last Year" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeRange(filter.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === filter.id
                    ? "bg-[#6679C0] text-white"
                    : "bg-gray-100 text-[#717685] hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Total Bookings"
            value={bookingStats.total || 0}
            trend={
              bookingStats.growth
                ? {
                    value: `${Math.abs(bookingStats.growth).toFixed(1)}%`,
                    isPositive: bookingStats.growth > 0,
                  }
                : null
            }
            bgColor="#DBEAFE"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(revenueStats.totalRevenue || 0)}
            trend={
              revenueStats.growth
                ? {
                    value: `${Math.abs(revenueStats.growth).toFixed(1)}%`,
                    isPositive: revenueStats.growth > 0,
                  }
                : null
            }
            bgColor="#D1FAE5"
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={userStats.total || 0}
            trend={
              userStats.growth
                ? {
                    value: `${Math.abs(userStats.growth).toFixed(1)}%`,
                    isPositive: userStats.growth > 0,
                  }
                : null
            }
            bgColor="#E0E7FF"
          />
          <StatCard
            icon={Car}
            label="Total Vehicles"
            value={vehicleStats.total || 0}
            trend={
              vehicleStats.growth
                ? {
                    value: `${Math.abs(vehicleStats.growth).toFixed(1)}%`,
                    isPositive: vehicleStats.growth > 0,
                  }
                : null
            }
            bgColor="#FEF3C7"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#717685] font-medium">
                Active Bookings
              </p>
              <Calendar className="w-5 h-5 text-[#6679C0]" />
            </div>
            <p className="text-xl font-bold text-[#131A34]">
              {bookingStats.active || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#717685] font-medium">
                Pending Requests
              </p>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-[#131A34]">
              {requestStats.pending || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#717685] font-medium">
                Available Vehicles
              </p>
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-[#131A34]">
              {vehicleStats.available || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#717685] font-medium">New Users</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-[#131A34]">
              {userStats.newUsers || 0}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34] mb-6">
              Revenue Trend
            </h3>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    stroke="#717685"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#717685"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                    }}
                    formatter={(value) =>
                      new Intl.NumberFormat("vi-VN").format(value) + " đ"
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#6679C0"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#717685]">
                No revenue data available
              </div>
            )}
          </div>

          {/* Booking Status Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34] mb-6">
              Bookings by Status
            </h3>
            {bookingStats.byStatus ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(bookingStats.byStatus).map(
                    ([key, value]) => ({
                      name: key.charAt(0).toUpperCase() + key.slice(1),
                      value,
                    }),
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    stroke="#717685"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#717685"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6679C0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#717685]">
                No booking data available
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate("/bookings")}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all text-left group"
          >
            <Calendar className="w-10 h-10 text-[#6679C0] mb-4" />
            <h4 className="font-bold text-[#131A34] mb-1 group-hover:text-[#6679C0] transition-colors">
              Manage Bookings
            </h4>
            <p className="text-sm text-[#717685]">
              View and manage all rental bookings
            </p>
          </button>

          <button
            onClick={() => navigate("/requests")}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all text-left group"
          >
            <Clock className="w-10 h-10 text-yellow-600 mb-4" />
            <h4 className="font-bold text-[#131A34] mb-1 group-hover:text-[#6679C0] transition-colors">
              Support Requests
            </h4>
            <p className="text-sm text-[#717685]">
              Handle customer support requests
            </p>
          </button>

          <button
            onClick={() => navigate("/users")}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all text-left group"
          >
            <Users className="w-10 h-10 text-blue-600 mb-4" />
            <h4 className="font-bold text-[#131A34] mb-1 group-hover:text-[#6679C0] transition-colors">
              User Management
            </h4>
            <p className="text-sm text-[#717685]">Manage platform users</p>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
