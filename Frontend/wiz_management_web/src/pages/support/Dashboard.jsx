import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, TrendingUp, Eye, ChevronRight } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';

export default function Dashboard({ requests, currentUser }) {
  const navigate = useNavigate();

  const myRequests = requests.filter(r => r.handledBy === currentUser);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myApproved = myRequests.filter(r => r.status === 'approved').length;
  const myDenied = myRequests.filter(r => r.status === 'denied').length;
  const totalHandled = myApproved + myDenied;

  // daily activity data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(date => {
    const dayRequests = myRequests.filter(r => 
      r.handledAt && r.handledAt.startsWith(date)
    );
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      approved: dayRequests.filter(r => r.status === 'approved').length,
      denied: dayRequests.filter(r => r.status === 'denied').length
    };
  });

  // category distribution
  const categoryData = {};
  myRequests.forEach(req => {
    categoryData[req.category] = (categoryData[req.category] || 0) + 1;
  });

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .slice(0, 5);
  
  const COLORS = ['#6679C0', '#B2BCE0', '#DBE3FF', '#131A34', '#717685'];

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
      denied: { bg: 'bg-red-50', text: 'text-red-700', label: 'Denied' }
    };
    return badges[status];
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">Dashboard</h1>
        <p className="text-[#717685]">Welcome back! Here's your overview</p>
      </div>

      {/* stats grid */}
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
          trend={{ isPositive: true, value: '18%' }}
          bgColor="#E0E7FF"
        />
        <StatCard
          icon={XCircle}
          label="My Denied"
          value={myDenied}
          bgColor="#E0E7FF"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Handled"
          value={totalHandled}
          trend={{ isPositive: true, value: '12%' }}
          bgColor="#E0E7FF"
        />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* daily activity chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">My Activity (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis 
                dataKey="date" 
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
              <Bar dataKey="approved" fill="#9AE8AB" radius={[8, 8, 0, 0]} />
              <Bar dataKey="denied" fill="#F95E5B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* category distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#131A34] mb-6">Requests by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[#717685]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* recent pending requests */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#131A34]">Recent Pending Requests</h3>
            <p className="text-sm text-[#717685] mt-1">{pendingRequests.length} requests waiting</p>
          </div>
          <button
            onClick={() => navigate('/support/requests?filter=pending')}
            className="flex items-center gap-2 px-4 py-2 text-[#6679C0] hover:bg-[#F8F9FF] rounded-xl transition-all font-semibold"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {pendingRequests.slice(0, 5).map(req => {
            const badge = getStatusBadge(req.status);
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/support/requests/${req.id}`)}
                className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                        {req.title}
                      </h4>
                      <span className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}>
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