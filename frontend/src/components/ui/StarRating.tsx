import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange(star)}
          className={cn(
            "p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent"
          )}
        >
          <Star
            className={cn(
              "w-6 h-6 transition-all",
              star <= value 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-transparent text-muted-foreground hover:text-yellow-400/50"
            )}
          />
        </button>
      ))}
    </div>
  );
};
