// src/components/StatCard.jsx
import React from 'react';

export default function StatCard({ icon: Icon, label, value, trend, bgColor = '#F8F9FF' }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-xl" 
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-6 h-6" style={{ color: '#6679C0' }} />
        </div>
        {trend && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-50 text-green-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      
      <div className="mb-1">
        <p className="text-sm text-[#717685] font-medium mb-2">{label}</p>
        <p className="text-3xl font-bold text-[#131A34]">{value.toLocaleString()}</p>
      </div>
      
      {trend && (
        <p className="text-xs text-[#717685] mt-2">Compared with previous 30 days</p>
      )}
    </div>
  );
}