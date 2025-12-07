import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Dashboard from '../support/Dashboard';

export default function SupportView({ requests, currentUser }) {
  const navigate = useNavigate();

  return (
    <div>
      {/* back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-[#717685] hover:text-[#131A34] font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Admin Dashboard
        </button>
      </div>

      {/* info banner */}
      <div className="bg-[#6679C0] rounded-2xl p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-2">Viewing as Customer Support</h2>
        <p className="text-white/80">You are viewing the support dashboard with admin privileges. All support features are available.</p>
      </div>

      {/* support dashboard */}
      <Dashboard requests={requests} currentUser={currentUser} />
    </div>
  );
}