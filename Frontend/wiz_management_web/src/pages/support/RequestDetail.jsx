// src/pages/support/RequestDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User, Mail, Phone, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function RequestDetail({ requests, onApprove, onDeny, currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const request = requests.find(r => r.id === id);
  
  const [denialReason, setDenialReason] = useState('');
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  if (!request) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#131A34] mb-2">Request Not Found</h2>
          <p className="text-[#717685] mb-6">The request you're looking for doesn't exist</p>
          <button
            onClick={() => navigate('/support/requests')}
            className="px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const handleAction = (action) => {
    if (action === 'approve') {
      setConfirmAction('approve');
      setShowConfirm(true);
    } else {
      if (!denialReason.trim()) {
        setShowDenialInput(true);
        return;
      }
      setConfirmAction('deny');
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'approve') {
      onApprove(request.id);
    } else {
      onDeny(request.id, denialReason);
    }
    setShowConfirm(false);
    navigate('/support/requests');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
      denied: { bg: 'bg-red-50', text: 'text-red-700', label: 'Denied' }
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
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/support/requests')}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] mb-4 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Requests
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#131A34] mb-2">{request.title}</h1>
            <p className="text-[#717685]">Request ID: {request.id}</p>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Request Details</h2>
            <div className="bg-[#F8F9FF] rounded-xl p-6">
              <p className="text-[#131A34] leading-relaxed whitespace-pre-wrap">{request.body}</p>
            </div>
          </div>

          {/* Attached Photos */}
          {request.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attached Photos ({request.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {request.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(photo)}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all border-2 border-gray-100 hover:border-[#6679C0]"
                  >
                    <img src={photo} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Handler Info */}
          {request.status !== 'pending' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">Handling Information</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Handled By</p>
                  <p className="font-semibold text-[#131A34]">{request.handledBy || 'N/A'}</p>
                </div>
                <div className="bg-[#F8F9FF] rounded-xl p-4">
                  <p className="text-sm text-[#717685] mb-1">Handled At</p>
                  <p className="font-semibold text-[#131A34]">
                    {request.handledAt ? new Date(request.handledAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {request.denialReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 mb-2 font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Denial Reason
                  </p>
                  <p className="text-red-900">{request.denialReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Denial Input */}
          {showDenialInput && request.status === 'pending' && (
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Denial Reason Required
              </h2>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                rows="5"
                placeholder="Please provide a clear explanation for denying this request. This message will be sent to the customer."
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Name</p>
                  <p className="font-semibold text-[#131A34]">{request.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Email</p>
                  <p className="font-semibold text-[#131A34] break-all">{request.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F8F9FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#6679C0]" />
                </div>
                <div>
                  <p className="text-sm text-[#717685]">Phone</p>
                  <p className="font-semibold text-[#131A34]">{request.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#131A34] mb-4">Request Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#717685] mb-1">Category</p>
                <span className="inline-block bg-[#F8F9FF] text-[#6679C0] px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {request.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#717685] mb-1">Created At</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#717685]" />
                  <p className="font-semibold text-[#131A34]">
                    {new Date(request.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#131A34] mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('approve')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#9AE8AB] text-131A34 rounded-xl font-semibold hover:bg-[#7dd89a] transition-all shadow-lg hover:shadow-xl"
                >
                  {/* <CheckCircle className="w-5 h-5" /> */}
                  Approve Request
                </button>
                <button
                  onClick={() => handleAction('deny')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F95E5B] text-white rounded-xl font-semibold hover:bg-[#f73d39] transition-all shadow-lg hover:shadow-xl"
                >
                  {/* <XCircle className="w-5 h-5" /> */}
                  Deny Request
                </button>
              </div>
              <p className="text-xs text-[#717685] mt-4 text-center">
                This action cannot be undone
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img src={selectedImage} alt="Preview" className="w-full h-auto rounded-2xl shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={confirmAction === 'approve' ? 'Approve Request?' : 'Deny Request?'}
        message={
          confirmAction === 'approve'
            ? 'Are you sure you want to approve this request? This action cannot be undone.'
            : 'Are you sure you want to deny this request? The customer will receive your explanation.'
        }
        type={confirmAction}
      />
    </div>
  );
}