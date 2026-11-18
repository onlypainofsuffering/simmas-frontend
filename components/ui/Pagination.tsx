'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: Array<number | 'ellipsis'> = [];
  if (totalPages <= 7) {
    for (let current = 1; current <= totalPages; current += 1) pages.push(current);
  } else {
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    pages.push(1);
    if (start > 2) pages.push('ellipsis');
    for (let current = start; current <= end; current += 1) pages.push(current);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const buttonClass =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={cn('flex items-center justify-end gap-1 border-t border-slate-100 p-4', className)}>
      <button
        type="button"
        aria-label="Halaman sebelumnya"
        className={buttonClass}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={15} />
      </button>
      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Halaman ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={cn(buttonClass, item === page && 'border-blue-600 bg-blue-600 text-white hover:border-blue-600 hover:bg-blue-600')}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Halaman berikutnya"
        className={buttonClass}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
