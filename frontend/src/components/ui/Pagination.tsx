import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'dots')[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (page > siblingCount + 2) {
      pages.push('dots');
    }
    
    for (
      let i = Math.max(2, page - siblingCount);
      i <= Math.min(totalPages - 1, page + siblingCount);
      i++
    ) {
      pages.push(i);
    }
    
    if (page < totalPages - siblingCount - 1) {
      pages.push('dots');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        className="w-9 h-9 p-0"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, idx) => {
        if (p === 'dots') {
          return (
            <span
              key={`dots-${idx}`}
              className="flex items-center justify-center w-9 h-9 text-gray-500"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        return (
          <Button
            key={p}
            variant={page === p ? 'default' : 'outline'}
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => onPageChange(p as number)}
            aria-current={page === p ? 'page' : undefined}
          >
            {p}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        className="w-9 h-9 p-0"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};
