import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          {type === 'approve' ? (
            <div className="w-14 h-14 bg-[#9AE8AB]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-[#9AE8AB]" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-[#F95E5B]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-7 h-7 text-[#F95E5B]" />
            </div>
          )}
          <h3 className="text-xl font-bold text-[#131A34]">{title}</h3>
        </div>
        
        <p className="text-[#717685] mb-8 leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${
              type === 'approve' 
                ? 'bg-[#9AE8AB] text-[#131A34] hover:bg-[#7dd89a]' 
                : 'bg-[#F95E5B] text-white hover:bg-[#f73d39]'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}