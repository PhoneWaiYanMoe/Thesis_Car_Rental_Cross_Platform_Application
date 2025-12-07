// src/pages/support/RequestList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, ChevronDown, ImageIcon } from 'lucide-react';

export default function RequestList({ requests, currentUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('filter') || 'all');
  const [filterHandler, setFilterHandler] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setFilterStatus(filter);
    }
  }, [searchParams]);

  const categories = ['all', ...new Set(requests.map(r => r.category))];
  const handlers = ['all', 'me', ...new Set(requests.map(r => r.handledBy).filter(Boolean))];

  let filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || req.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesHandler = filterHandler === 'all' || 
                          (filterHandler === 'me' && req.handledBy === currentUser) ||
                          req.handledBy === filterHandler;
    return matchesSearch && matchesCategory && matchesStatus && matchesHandler;
  });

  // Sort
  filteredRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
      denied: { bg: 'bg-red-50', text: 'text-red-700', label: 'Denied' }
    };
    return badges[status];
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131A34] mb-2">All Requests</h1>
        <p className="text-[#717685]">Manage and review customer requests</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 overflow-x-auto">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'denied', label: 'Denied' }
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

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, ID, or customer name..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-[#F8F9FF] transition-all font-semibold text-[#131A34]"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white font-semibold text-[#131A34]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            {/* <option value="status">Sort by Status</option> */}
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#131A34] mb-2">Handled By</label>
              <select
                value={filterHandler}
                onChange={(e) => setFilterHandler(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none bg-white"
              >
                {handlers.map(handler => (
                  <option key={handler} value={handler}>
                    {handler === 'all' ? 'All Handlers' : handler === 'me' ? 'My Requests' : handler}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#717685]">
          Showing <span className="font-semibold text-[#131A34]">{filteredRequests.length}</span> results
        </p>
        {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || filterHandler !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
              setFilterStatus('all');
              setFilterHandler('all');
            }}
            className="text-sm text-[#6679C0] hover:text-[#131A34] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Request List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#F8F9FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#B2BCE0]" />
            </div>
            <p className="text-[#717685] text-lg font-medium">No requests found</p>
            <p className="text-[#B2BCE0] text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRequests.map(req => {
              const badge = getStatusBadge(req.status);
              return (
                <div
                  key={req.id}
                  onClick={() => navigate(`/support/requests/${req.id}`)}
                  className="p-6 hover:bg-[#F8F9FF] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      {/* <div className="mt-1">
                        {getStatusIcon(req.status)}
                      </div> */}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-[#131A34] group-hover:text-[#6679C0] transition-colors">
                            {req.title}
                          </h4>
                          <span className={`${badge.bg} ${badge.text} px-2.5 py-1 rounded-lg text-xs font-semibold`}>
                            {badge.label}
                          </span>
                          {req.photos.length > 0 && (
                            <span className="flex items-center gap-1 text-[#6679C0] text-xs font-semibold">
                              <ImageIcon className="w-4 h-4" />
                              {req.photos.length}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#717685] mb-2 flex-wrap">
                          <span className="font-medium">{req.id}</span>
                          <span>•</span>
                          <span>{req.category}</span>
                          <span>•</span>
                          <span>{req.customerName}</span>
                        </div>

                        <p className="text-sm text-[#717685] line-clamp-1">{req.body}</p>

                        {req.handledBy && (
                          <div className="mt-2 text-xs text-[#717685]">
                            Handled by <span className="font-semibold text-[#131A34]">{req.handledBy}</span> on {new Date(req.handledAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#717685]">{new Date(req.createdAt).toLocaleDateString()}</span>
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