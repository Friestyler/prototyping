"use client";

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  entityName: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  total,
  page,
  perPage,
  entityName,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-7 py-3 border-t border-border text-[13px] text-muted">
      <span>
        Showing {start}&ndash;{end} of {total.toLocaleString()} {entityName}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`w-8 h-8 rounded-md border border-b2 bg-white flex items-center justify-center text-[13px] font-medium text-gray-700 transition-all ${
            page === 1 ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-gray-50"
          }`}
        >
          &lsaquo;
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-muted">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-md border flex items-center justify-center text-[13px] font-medium cursor-pointer transition-all ${
                p === page
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-gray-700 border-b2 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`w-8 h-8 rounded-md border border-b2 bg-white flex items-center justify-center text-[13px] font-medium text-gray-700 transition-all ${
            page === totalPages ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-gray-50"
          }`}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
