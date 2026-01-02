import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // for showing 5 page numbers at a time

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Trước
      </button>

      {currentPage > 3 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] transition-all"
          >
            1
          </button>
          {currentPage > 4 && <span className="text-[#717685]">...</span>}
        </>
      )}

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            currentPage === page
              ? "bg-[#6679C0] text-white"
              : "border border-gray-200 text-[#131A34] hover:bg-[#F8F9FF]"
          }`}
        >
          {page}
        </button>
      ))}

      {currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && (
            <span className="text-[#717685]">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-[#131A34] hover:bg-[#F8F9FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Sau
      </button>
    </div>
  );
}
