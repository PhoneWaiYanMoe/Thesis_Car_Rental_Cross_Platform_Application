import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Car, DollarSign, Shield } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';

export default function AdminDashboard({ carData = [], userData = [], bookingData = [] }) {
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState('all');

  // calculate statistics
  const totalRevenue = bookingData.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalProfit = totalRevenue * 0.08;
  const totalUsers = userData.length;
  const totalCars = carData.length;

  // most rented car types
  const carTypeData = carData.reduce((acc, car) => {
    const type = car.vehicleType;
    acc[type] = (acc[type] || 0) + (car.totalRentals || 0);
    return acc;
  }, {});

  const carTypeChartData = Object.entries(carTypeData).map(([name, value]) => ({ name, value }));

  // seater distribution
  const seaterData = carData.reduce((acc, car) => {
    const seater = `${car.seater} Seater`;
    acc[seater] = (acc[seater] || 0) + (car.totalRentals || 0);
    return acc;
  }, {});

  const seaterChartData = Object.entries(seaterData).map(([name, value]) => ({ name, value }));

  // fuel type distribution
  const fuelData = carData.reduce((acc, car) => {
    acc[car.fuelType] = (acc[car.fuelType] || 0) + (car.totalRentals || 0);
    return acc;
  }, {});

  const fuelChartData = Object.entries(fuelData).map(([name, value]) => ({ name, value }));

  // monthly revenue
  const monthlyRevenue = [
    { month: 'Jan', revenue: 125000, profit: 10000 },
    { month: 'Feb', revenue: 145000, profit: 11600 },
    { month: 'Mar', revenue: 165000, profit: 13200 },
    { month: 'Apr', revenue: 155000, profit: 12400 },
    { month: 'May', revenue: 185000, profit: 14800 },
    { month: 'Jun', revenue: 195000, profit: 15600 },
  ];

  // transmission type
  const transmissionData = carData.reduce((acc, car) => {
    acc[car.transmission] = (acc[car.transmission] || 0) + (car.totalRentals || 0);
    return acc;
  }, {});

  const transmissionChartData = Object.entries(transmissionData).map(([name, value]) => ({ name, value }));

  // top rated cars
  const topRatedCars = [...carData]
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 5);

  // top car owners
  const ownerRentals = carData.reduce((acc, car) => {
    acc[car.ownerName] = (acc[car.ownerName] || 0) + (car.totalRentals || 0);
    return acc;
  }, {});

  const topOwners = Object.entries(ownerRentals)
    .map(([name, rentals]) => ({ name, rentals }))
    .sort((a, b) => b.rentals - a.rentals)
    .slice(0, 5);

  const COLORS = ['#6679C0', '#9AE8AB', '#F95E5B', '#DBE3FF', '#B2BCE0', '#717685'];

  return (
    <div>
      {/* header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">Admin Dashboard</h1>
          <p className="text-[#717685]">Complete overview of your car rental platform</p>
        </div>
        <button
          onClick={() => navigate('/support/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all shadow-lg"
        >
          <Shield className="w-5 h-5" />
          View as Support
        </button>
      </div>

      {/* time period filter */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-semibold text-[#717685]">Time Period:</span>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
        >
          <option value="all">All Time</option>
          <option value="year">This Year</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {/* main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={{ isPositive: true, value: '15%' }}
          bgColor="#D1FAE5"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Profit (8%)"
          value={`$${totalProfit.toLocaleString()}`}
          trend={{ isPositive: true, value: '15%' }}
          bgColor="#DBEAFE"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          trend={{ isPositive: true, value: '23%' }}
          bgColor="#E0E7FF"
        />
        <StatCard
          icon={Car}
          label="Total Cars"
          value={totalCars}
          trend={{ isPositive: true, value: '8%' }}
          bgColor="#FEF3C7"
        />
      </div>

      {/* revenue charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* monthly revenue and profit */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis 
                dataKey="month" 
                stroke="#717685" 
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#717685" 
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6679C0" strokeWidth={3} dot={{ r: 5 }} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#9AE8AB" strokeWidth={3} dot={{ r: 5 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* car type distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Most Rented Vehicle Types</h3>
          {carTypeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carTypeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#717685" style={{ fontSize: '12px' }} tickLine={false} />
                <YAxis stroke="#717685" style={{ fontSize: '12px' }} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6679C0" radius={[8, 8, 0, 0]} name="Rentals" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#717685]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* seater distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Seater Distribution</h3>
          {seaterChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={seaterChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {seaterChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#717685]">
              No data available
            </div>
          )}
        </div>

        {/* fuel type distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Fuel Type Distribution</h3>
          {fuelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fuelChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fuelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#717685]">
              No data available
            </div>
          )}
        </div>

        {/* transmission distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Transmission Type</h3>
          {transmissionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={transmissionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transmissionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#717685]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* top rated cars */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34]">Top Rated Cars</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topRatedCars.length > 0 ? (
              topRatedCars.map((car, idx) => (
                <div key={car.id} className="p-6 hover:bg-[#F8F9FF] transition-all">
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
                      <p className="font-bold text-[#6679C0]">★ {parseFloat(car.rating).toFixed(1)}</p>
                      <p className="text-xs text-[#717685]">{car.totalRentals} rentals</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-[#717685]">No data available</div>
            )}
          </div>
        </div>

        {/* top car owners */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-[#131A34]">Top Car Owners</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topOwners.length > 0 ? (
              topOwners.map((owner, idx) => (
                <div key={idx} className="p-6 hover:bg-[#F8F9FF] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 bg-[#9AE8AB] text-[#131A34] rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <p className="font-semibold text-[#131A34]">{owner.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#131A34]">{owner.rentals}</p>
                      <p className="text-xs text-[#717685]">total rentals</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-[#717685]">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}