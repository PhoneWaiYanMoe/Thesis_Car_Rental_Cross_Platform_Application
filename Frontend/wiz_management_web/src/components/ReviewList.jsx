import React, { useState } from "react";
import { Star, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";

export default function ReviewList({ reviews, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState({});

  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  const toggleReview = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#717685]">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {currentReviews.map((review) => {
          const isExpanded = expandedReviews[review.id];
          const shouldTruncate = review.comment.length > 150;

          return (
            <div
              key={review.id}
              className="bg-white border border-gray-100 rounded-2xl p-6"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6679C0] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {review.userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#131A34]">
                      {review.userName}
                    </p>
                    <p className="text-sm text-[#717685]">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-[#131A34]">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-3">
                <p className="text-[#131A34] leading-relaxed">
                  {shouldTruncate && !isExpanded
                    ? `${review.comment.substring(0, 150)}...`
                    : review.comment}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => toggleReview(review.id)}
                    className="text-[#6679C0] hover:text-[#131A34] font-semibold text-sm mt-2 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Thu gọn <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Review Images */}
              {isExpanded && review.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-xl overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Review ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Helpful Counter */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-2 text-[#717685] hover:text-[#6679C0] transition-all">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Hữu ích ({review.helpful})
                  </span>
                </button>
              </div>

              {/* Owner Reply */}
              {isExpanded && review.reply && (
                <div className="mt-4 ml-8 bg-[#F8F9FF] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#6679C0] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {review.ownerName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#131A34] text-sm">
                        {review.ownerName}
                      </p>
                      <p className="text-xs text-[#717685]">
                        {formatDate(review.reply.repliedAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#131A34]">
                    {review.reply.comment}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Trước
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                currentPage === i + 1
                  ? "bg-[#6679C0] text-white"
                  : "border border-gray-200 text-[#131A34] hover:bg-[#F8F9FF]"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
