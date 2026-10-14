"use client";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  total,
  limit,
  isFetching,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);

  const visiblePages: (number | "...")[] =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : page <= 3
        ? [1, 2, 3, 4, "...", totalPages]
        : page >= totalPages - 2
          ? [
              1,
              "...",
              totalPages - 3,
              totalPages - 2,
              totalPages - 1,
              totalPages,
            ]
          : [1, "...", page - 1, page, page + 1, "...", totalPages];

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 pt-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {Math.min((page - 1) * limit + 1, total)}–
        {Math.min(page * limit, total)} of {total} products
      </p>

      <nav
        className="flex flex-wrap items-center gap-1"
        aria-label="Product pages"
      >
        <button
          type="button"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40  hover:bg-gray-100"
        >
          Previous
        </button>

        {visiblePages.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Go to page ${item}`}
              aria-current={page === item ? "page" : undefined}
              disabled={isFetching}
              onClick={() => onPageChange(item)}
              className={`min-w-10 rounded-lg border px-3 py-2 disabled:opacity-40 ${
                page === item
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "bg-white hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40 hover:bg-gray-100"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
