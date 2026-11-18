import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Server-Side Pagination Component
 *
 * Implements full server-side pagination with database-level querying:
 * - Dynamic rows-per-page selector (5, 10, 20, 50, 100)
 * - Accurate "Showing X–Y of Z records" count
 * - Accessible Next / Previous and numbered page buttons with ellipses
 * - Auto-resets to page 1 on page size change
 */
export default function ServerPagination({
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  totalPages: controlledTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  loading = false,
  recordLabel = 'records',
  className = '',
  showPageSizeDropdown = true,
}) {
  const calculatedTotalPages = Math.max(1, Math.ceil(totalRecords / (pageSize || 10)));
  const totalPages = controlledTotalPages !== undefined ? Math.max(1, controlledTotalPages) : calculatedTotalPages;

  const from = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);

  const handlePageChange = (newPage) => {
    if (loading) return;
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    if (typeof onPageChange === 'function') {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (typeof onPageSizeChange === 'function') {
      onPageSizeChange(newSize);
    }
    if (typeof onPageChange === 'function') {
      onPageChange(1);
    }
  };

  // Generate page numbers with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-4 sm:px-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-xs sm:text-sm text-black select-none ${className}`}
      aria-label="Server-Side Pagination Navigation"
    >
      {/* ─── Left Section: Record Count & Optional Rows Per Page Selector ─── */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        {showPageSizeDropdown && (
          <>
            <div className="flex items-center gap-2">
              <label htmlFor="server-pagination-page-size" className="font-bold text-black whitespace-nowrap text-xs">
                Rows per page:
              </label>
              <div className="relative">
                <select
                  id="server-pagination-page-size"
                  value={pageSize}
                  disabled={loading}
                  onChange={handlePageSizeChange}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-300 font-extrabold text-black text-xs rounded-xl pl-2.5 pr-7 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors shadow-2xs"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt} className="text-black font-bold">
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-black font-black text-[9px]">
                  ▼
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden min-[480px]:block" />
          </>
        )}

        <div className="text-black font-medium text-xs sm:text-sm">
          Showing <span className="font-extrabold text-black">{from}</span>–
          <span className="font-extrabold text-black">{to}</span> of{' '}
          <span className="font-extrabold text-black">{totalRecords}</span> {recordLabel}
        </div>
      </div>

      {/* ─── Right Section: Previous, Numbered Buttons, Next ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center w-full sm:w-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold border border-slate-300 bg-white text-black hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
          aria-label="Previous Page"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 font-extrabold text-xs"
                >
                  •••
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageChange(p)}
                disabled={loading}
                aria-current={isActive ? 'page' : undefined}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                    : 'bg-white border border-slate-200 text-black hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                } disabled:opacity-50`}
                title={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold border border-slate-300 bg-white text-black hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
          aria-label="Next Page"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

