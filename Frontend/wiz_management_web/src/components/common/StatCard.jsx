import React from "react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  bgColor = "#F8F9FF",
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-6 h-6 text-[#6679C0]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#717685] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#131A34]">{value}</p>
        </div>
      </div>
    </div>
  );
}
