import React, { useState } from "react";
import { Search, UserPlus, Eye, Settings } from "lucide-react";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useNavigate } from 'react-router-dom';

export default function StaffManagement({
  staffData,
  onCreateStaff,
  onUpdateStaffStatus,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState("");

  let filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || staff.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateStaff = () => {
    if (newStaff.username && newStaff.password && newStaff.email) {
      setConfirmType("create");
      setShowConfirm(true);
    }
  };

  const handleStatusChange = (staff, status) => {
    setSelectedStaff(staff);
    setNewStatus(status);
    setConfirmType("status");
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (confirmType === "create") {
      onCreateStaff(newStaff);
      setNewStaff({ username: "", password: "", email: "" });
      setShowCreateModal(false);
    } else if (confirmType === "status") {
      onUpdateStaffStatus(selectedStaff.id, newStatus);
      setShowStatusUpdate(false);
      setSelectedStaff(null);
    }
    setShowConfirm(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
      stopped: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        label: "Suspended",
      },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
    };
    return badges[status];
  };

  const statusCounts = {
    all: staffData.length,
    normal: staffData.filter((s) => s.status === "normal").length,
    stopped: staffData.filter((s) => s.status === "stopped").length,
    banned: staffData.filter((s) => s.status === "banned").length,
  };

  return (
    <div>
      {/* header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">
            Support Staff Management
          </h1>
          <p className="text-[#717685]">
            Manage customer support team accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Create New Staff
        </button>
      </div>

      {/* status tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: "all", label: "All Staff" },
          { id: "normal", label: "Active" },
          { id: "stopped", label: "Suspended" },
          { id: "banned", label: "Banned" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filterStatus === tab.id
                ? "bg-[#6679C0] text-white shadow-lg"
                : "text-[#717685] hover:bg-[#F8F9FF]"
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterStatus === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-[#717685]"
              }`}
            >
              {statusCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username, email, or ID..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* staff grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => {
          const badge = getStatusBadge(staff.status);
          return (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6679C0] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {staff.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#131A34]">
                      {staff.username}
                    </h3>
                    <p className="text-xs text-[#717685]">{staff.id}</p>
                  </div>
                </div>
                <span
                  className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}
                >
                  {badge.label}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[#717685]">
                  <span>Email:</span>
                  <span className="text-[#131A34] font-medium">
                    {staff.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#717685]">
                  <span>Created:</span>
                  <span className="text-[#131A34] font-medium">
                    {new Date(staff.createdDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* <div className="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#6679C0]">{staff.totalHandled || 0}</p>
                  <p className="text-xs text-[#717685]">Handled</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#9AE8AB]">{staff.totalApproved || 0}</p>
                  <p className="text-xs text-[#717685]">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#F95E5B]">{staff.totalDenied || 0}</p>
                  <p className="text-xs text-[#717685]">Denied</p>
                </div>
              </div> */}

              <div className="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-gray-100">
                <div
                  className="text-center cursor-pointer hover:bg-[#F8F9FF] rounded-lg p-2 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/staff-requests/${staff.id}?status=all`);
                  }}
                >
                  <p className="text-lg font-bold text-[#6679C0]">
                    {staff.totalHandled || 0}
                  </p>
                  <p className="text-xs text-[#717685]">Handled</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-[#F8F9FF] rounded-lg p-2 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/admin/staff-requests/${staff.id}?status=approved`
                    );
                  }}
                >
                  <p className="text-lg font-bold text-[#9AE8AB]">
                    {staff.totalApproved || 0}
                  </p>
                  <p className="text-xs text-[#717685]">Approved</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-[#F8F9FF] rounded-lg p-2 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/staff-requests/${staff.id}?status=denied`);
                  }}
                >
                  <p className="text-lg font-bold text-[#F95E5B]">
                    {staff.totalDenied || 0}
                  </p>
                  <p className="text-xs text-[#717685]">Denied</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedStaff(staff);
                  setShowStatusUpdate(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F8F9FF] text-[#6679C0] rounded-xl font-semibold hover:bg-[#DBE3FF] transition-all"
              >
                <Settings className="w-4 h-4" />
                Manage Status
              </button>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UserPlus className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
          <p className="text-[#717685] text-lg font-medium">
            No staff members found
          </p>
          <p className="text-[#B2BCE0] text-sm mt-1">
            Try adjusting your search
          </p>
        </div>
      )}

      {/* create staff modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#131A34] mb-6">
              Create New Staff Account
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newStaff.username}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#131A34] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewStaff({ username: "", password: "", email: "" });
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={
                  !newStaff.username || !newStaff.password || !newStaff.email
                }
                className="flex-1 px-6 py-3 bg-[#6679C0] text-white rounded-xl font-semibold hover:bg-[#131A34] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* status update modal */}
      {showStatusUpdate && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-[#131A34] mb-2">
              Update Staff Status
            </h3>
            <p className="text-[#717685] mb-6">{selectedStaff.username}</p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleStatusChange(selectedStaff, "normal")}
                disabled={selectedStaff.status === "normal"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "normal"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Set as Active
              </button>
              <button
                onClick={() => handleStatusChange(selectedStaff, "stopped")}
                disabled={selectedStaff.status === "stopped"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "stopped"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                }`}
              >
                Suspend Account
              </button>
              <button
                onClick={() => handleStatusChange(selectedStaff, "banned")}
                disabled={selectedStaff.status === "banned"}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedStaff.status === "banned"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Ban Staff Member
              </button>
            </div>

            <button
              onClick={() => {
                setShowStatusUpdate(false);
                setSelectedStaff(null);
              }}
              className="w-full px-6 py-3 border border-gray-200 text-[#131A34] rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={
          confirmType === "create"
            ? "Create Staff Account?"
            : `Change Status to ${newStatus}?`
        }
        message={
          confirmType === "create"
            ? `Create a new staff account for ${newStaff.username}? They will be able to access the support portal.`
            : `Are you sure you want to change this staff member's status to ${newStatus}?`
        }
        type="approve"
      />
    </div>
  );
}
