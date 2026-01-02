import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Eye,
  ChevronRight,
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

export default function Dashboard({ carData = [], userData = [], bookingData = [], requests = [] }) {
  const navigate = useNavigate();
  const { user, isAdmin, isSupport } = useAuth();

  // Support Staff Dashboard
  if (isSupport) {
    const myRequests = requests.filter((r) => r.handledBy === user.username);
    const pendingRequests = requests.filter((r) => r.status === "pending");
    const myApproved = myRequests.filter((r) => r.status === "approved").length;
    const myDenied = myRequests.filter((r) => r.status === "denied").length;
    const totalHandled = myApproved + myDenied;

    // Daily activity data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const dailyData = last7Days.map((date) => {
      const dayRequests = myRequests.filter(
        (r) => r.handledAt && r.handledAt.startsWith(date)
      );
      return {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        approved: dayRequests.filter((r) => r.status === "approved").length,
        denied: dayRequests.filter((r) => r.status === "denied").length,
      };
    });

    const getStatusBadge = (status) => {
      const badges = {
        pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending" },
        approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
        denied: { bg: "bg-red-50", text: "text-red-700", label: "Denied" },
      };
      return badges[status];
    };

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">Dashboard</h1>
          <p className="text-[#717685]">Welcome back, {user.name || user.username}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Clock}
            label="Pending Requests"
            value={pendingRequests.length}
            bgColor="#E0E7FF"
          />
          <StatCard
            icon={CheckCircle}
            label="My Approved"
            value={myApproved}
            bgColor="#E0E7FF"
          />
          <StatCard
            icon={XCircle}
            label="My Denied"
            value={myDenied}
            bgColor="#E0E7FF"
          />
          <StatCard
            icon={Clock}
            label="Total Handled"
            value={totalHandled}
            bgColor="#E0E7FF"
          />
        </div>

        {/* Activity Chart */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34] mb-6">
              My Activity (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
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
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="approved" fill="#9AE8AB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="denied" fill="#F95E5B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Pending Requests */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#131A34]">
                Recent Pending Requests
              </h3>
              <p className="text-sm text-[#717685] mt-1">
                {pendingRequests.length} requests waiting
              </p>
            </div>
            <button
              onClick={() => navigate("/requests")}
              className="flex items-center gap-2 px-4 py-2 text-[#6679C0] hover:bg-[#F8F9FF] rounded-xl transition-all font-semibold"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingRequests.slice(0, 5).map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <div
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                          {req.title}
                        </h4>
                        <span
                          className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#717685]">
                        <span className="font-medium">{req.id}</span>
                        <span>•</span>
                        <span>{req.category}</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
                  </div>
                </div>
              );
            })}

            {pendingRequests.length === 0 && (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-[#B2BCE0] mx-auto mb-3" />
                <p className="text-[#717685]">No pending requests at the moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    const totalRevenue = bookingData.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalProfit = totalRevenue * 0.08;
    const totalUsers = userData.length;
    const totalCars = carData.length;

    // Car type data
    const carTypeData = carData.reduce((acc, car) => {
      const type = car.vehicleType;
      acc[type] = (acc[type] || 0) + (car.totalRentals || 0);
      return acc;
    }, {});

    const carTypeChartData = Object.entries(carTypeData).map(([name, value]) => ({
      name,
      value,
    }));

    // Monthly revenue mock data
    const monthlyRevenue = [
      { month: "Jan", revenue: 125000000, profit: 10000000 },
      { month: "Feb", revenue: 145000000, profit: 11600000 },
      { month: "Mar", revenue: 165000000, profit: 13200000 },
      { month: "Apr", revenue: 155000000, profit: 12400000 },
      { month: "May", revenue: 185000000, profit: 14800000 },
      { month: "Jun", revenue: 195000000, profit: 15600000 },
    ];

    // Top rated cars
    const topRatedCars = [...carData]
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 5);

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[#717685]">
            Complete overview of your car rental platform
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(totalRevenue)}
            bgColor="#D1FAE5"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Profit (8%)"
            value={new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(totalProfit)}
            bgColor="#DBEAFE"
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={totalUsers}
            bgColor="#E0E7FF"
          />
          <StatCard
            icon={Car}
            label="Total Cars"
            value={totalCars}
            bgColor="#FEF3C7"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34] mb-6">
              Revenue & Profit Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
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
                  formatter={(value) => new Intl.NumberFormat("vi-VN").format(value) + " đ"}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6679C0"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#9AE8AB"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Car Type Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34] mb-6">
              Most Rented Vehicle Types
            </h3>
            {carTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carTypeChartData}>
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
                  <Bar
                    dataKey="value"
                    fill="#6679C0"
                    radius={[8, 8, 0, 0]}
                    name="Rentals"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#717685]">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Top Rated Cars */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#131A34]">Top Rated Cars</h3>
            <button
              onClick={() => navigate("/cars")}
              className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
            >
              See More
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {topRatedCars.length > 0 ? (
              topRatedCars.map((car, idx) => (
                <div
                  key={car.id}
                  onClick={() => navigate(`/cars/${car.id}`)}
                  className="p-6 hover:bg-[#F8F9FF] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 bg-[#6679C0] text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[#131A34]">{car.name}</p>
                        <p className="text-sm text-[#717685]">{car.ownerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#6679C0]">
                        ★ {parseFloat(car.rating).toFixed(1)}
                      </p>
                      <p className="text-xs text-[#717685]">
                        {car.totalRentals} rentals
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-[#717685]">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}