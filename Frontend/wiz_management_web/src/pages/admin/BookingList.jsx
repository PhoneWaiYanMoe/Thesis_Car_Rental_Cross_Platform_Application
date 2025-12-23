import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, ChevronDown, Calendar } from 'lucide-react';

export default function BookingList({ bookingData, carData, userData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Filter bookings by userId if provided
  let filteredBookings = userId 
    ? bookingData.filter(b => b.userId === userId)
    : bookingData;

  filteredBookings = filteredBookings.filter(booking => {
    const car = carData.find(c => c.id === booking.carId);
    const user = userData.find(u => u.id === booking.userId);
    
    const matchesSearch = booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'amount':
        const amountA = typeof a.amount === 'string' ? parseFloat(a.amount.replace(/[^\d]/g, '')) : a.amount;
        const amountB = typeof b.amount === 'string' ? parseFloat(b.amount.replace(/[^\d]/g, '')) : b.amount;
        return amountB - amountA;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
      ongoing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Ongoing' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' }
    };
    return badges[status];
  };

  const statusCounts = {
    all: filteredBookings.length,
    completed: bookingData.filter(b => b.status === 'completed').length,
    ongoing: bookingData.filter(b => b.status === 'ongoing').length,
    cancelled: bookingData.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">
          {userId ? 'User Bookings' : 'All Bookings'}
        </h1>
        <p className="text-[#717685]">View and manage rental bookings</p>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: 'all', label: 'All Bookings' },
          { id: 'completed', label: 'Completed' },
          { id: 'ongoing', label: 'Ongoing' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filterStatus === tab.id
                ? 'bg-[#6679C0] text-white shadow-lg'
                : 'text-[#717685] hover:bg-[#F8F9FF]'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              filterStatus === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-[#717685]'
            }`}>
              {statusCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* search and filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by booking ID, car, or user..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* results count */}
      <div className="mb-4">
        <p className="text-[#717685]">
          Showing <span className="font-semibold text-[#131A34]">{filteredBookings.length}</span> bookings
        </p>
      </div>

      {/* booking list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
            <p className="text-[#717685] text-lg font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBookings.map(booking => {
              const car = carData.find(c => c.id === booking.carId);
              const user = userData.find(u => u.id === booking.userId);
              const badge = getStatusBadge(booking.status);
              const amount = typeof booking.amount === 'string' ? booking.amount : 
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.amount);
              
              return (
                <div
                  key={booking.id}
                  onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {car && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                            {car?.name || 'Unknown Car'}
                          </h4>
                          <span className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#717685]">
                          <span className="font-medium">{booking.id}</span>
                          <span>•</span>
                          <span>{user?.name || 'Unknown User'}</span>
                          <span>•</span>
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-sm text-[#717685]">Amount</p>
                        <p className="font-bold text-[#6679C0]">{amount}</p>
                      </div>
                      <Eye className="w-5 h-5 text-[#B2BCE0] group-hover:text-[#6679C0] transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}