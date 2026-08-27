import React from 'react';
import { analyticsMessages } from '@/constants/messages/analytics';
import type { ContributionCategory } from '../types/analytics.types';

interface ContributionBadgeProps {
  category: ContributionCategory;
  className?: string;
}

const BADGE_STYLES: Record<ContributionCategory, string> = {
  HIGH: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-300',
  LOW: 'bg-amber-100 text-amber-800 border-amber-300',
  FREE_RIDER: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-300',
};

export const ContributionBadge: React.FC<ContributionBadgeProps> = ({ category, className = '' }) => {
  const config = analyticsMessages.categories[category] || analyticsMessages.categories.NORMAL;
  const badgeStyle = BADGE_STYLES[category] || BADGE_STYLES.NORMAL;

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      <span aria-hidden="true">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};
