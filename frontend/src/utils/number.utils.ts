/**
 * Number and Format Utilities for PeerReview-AI
 */

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded}%`;
};

export const formatScore = (value: number | null | undefined, maxScore: number = 100): string => {
  if (value === null || value === undefined || isNaN(value)) return `0/${maxScore}`;
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded}/${maxScore}`;
};
