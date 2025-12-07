import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Settings, AlertCircle, Car, CreditCard } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function UserDetail({ userData, onUpdateUserStatus }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = userData.find(u => u.id === id);
  
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">User Not Found</h2>
          <p className="text-[#717685] mb-6">The user you're looking for doesn't exist</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onUpdateUserStatus(user.id, newStatus);
    setShowConfirm(false);
    setShowStatusUpdate(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: 'bg-green-50', text: 'text-green-700', label: 'Normal' },
      stopped: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Stopped' },
      banned: { bg: 'bg-red-50', text: 'text-red-700', label: 'Banned' }
    };
    const badge = badges[status];
    return (
      <div className={`inline-flex items-center ${badge.bg} ${badge.text} px-4 py-2 rounded-xl font-semibold`}>
        {badge.label}
      </div>
    );
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Users
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#6679C0] rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#131A34] mb-2">{user.name}</h1>
              <p className="text-[#717685]">User ID: {user.id}</p>
            </div>
          </div>
          {getStatusBadge(user.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* personal information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Full Name</p>
                  <p className="font-semibold text-[#131A34]">{user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Email</p>
                  <p className="font-semibold text-[#131A34] break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Phone</p>
                  <p className="font-semibold text-[#131A34]">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Location</p>
                  <p className="font-semibold text-[#131A34]">{user.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Joined Date</p>
                  <p className="font-semibold text-[#131A34]">
                    {new Date(user.joinedDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">User Type</p>
                  <p className="font-semibold text-[#131A34]">
                    {user.type === 'renter' ? 'Renter' : 'Car Owner'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* activity statistics */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Activity Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">{user.totalBookings}</p>
                <p className="text-sm text-[#717685]">Total Bookings</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">{user.completedBookings || 0}</p>
                <p className="text-sm text-[#717685]">Completed</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">{user.cancelledBookings || 0}</p>
                <p className="text-sm text-[#717685]">Cancelled</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                <p className="text-3xl font-bold text-[#6679C0] mb-1">★ {user.rating || 4.5}</p>
                <p className="text-sm text-[#717685]">Rating</p>
              </div>
            </div>
          </div>

          {/* additional info for car owners */}
          {user.type === 'owner' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">Car Owner Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">{user.totalCars || 0}</p>
                  <p className="text-sm text-[#717685]">Total Cars</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">{user.totalRentals || 0}</p>
                  <p className="text-sm text-[#717685]">Total Rentals</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FF] rounded-xl">
                  <p className="text-3xl font-bold text-[#6679C0] mb-1">${user.totalEarnings || 0}</p>
                  <p className="text-sm text-[#717685]">Total Earnings</p>
                </div>
              </div>
            </div>
          )}

          {/* recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {user.recentActivity && user.recentActivity.length > 0 ? (
                user.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-[#F8F9FF] rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      {activity.type === 'booking' ? <Car className="w-5 h-5 text-[#6679C0]" /> : <CreditCard className="w-5 h-5 text-[#6679C0]" />}
                    </div>
                    <div>
                      <p className="font-semibold text-[#131A34]">{activity.description}</p>
                      <p className="text-sm text-[#717685]">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#717685] py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* account status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Status</span>
                <span className={`font-semibold ${
                  user.status === 'normal' ? 'text-green-700' :
                  user.status === 'stopped' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Verified</span>
                <span className="font-semibold text-[#131A34]">
                  {user.verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#717685]">Member Since</span>
                <span className="font-semibold text-[#131A34]">
                  {new Date(user.joinedDate).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* status update */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Update Status
            </h2>
            
            {!showStatusUpdate ? (
              <button
                onClick={() => setShowStatusUpdate(true)}
                className="w-full px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
              >
                Change User Status
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleStatusChange('normal')}
                  disabled={user.status === 'normal'}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    user.status === 'normal'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Set as Normal
                </button>
                <button
                  onClick={() => handleStatusChange('stopped')}
                  disabled={user.status === 'stopped'}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    user.status === 'stopped'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Suspend Account
                </button>
                <button
                  onClick={() => handleStatusChange('banned')}
                  disabled={user.status === 'banned'}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    user.status === 'banned'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Ban User
                </button>
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  className="w-full px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all">
                View Bookings
              </button>
              {user.type === 'owner' && (
                <button className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all">
                  View Cars
                </button>
              )}
              <button className="w-full px-6 py-3 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`Change Status to ${newStatus}?`}
        message={`Are you sure you want to change this user's status to ${newStatus}? This action will affect their access to the platform.`}
        type="approve"
      />
    </div>
  );
}