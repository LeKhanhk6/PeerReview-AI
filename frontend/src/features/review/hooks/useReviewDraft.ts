import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { ReviewDraftState, RubricCriterionDetail } from '../types/review.types';

export function useReviewDraft(
  reviewAssignmentId: string,
  criteriaList: RubricCriterionDetail[]
) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || 'guest';
  const draftKey = `review_draft_${reviewAssignmentId}_${userId}`;

  const [overallComment, setOverallComment] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load draft on mount or criteria change
  useEffect(() => {
    if (!reviewAssignmentId || criteriaList.length === 0) return;

    try {
      const savedRaw = localStorage.getItem(draftKey);
      if (savedRaw) {
        const parsed: ReviewDraftState = JSON.parse(savedRaw);

        const savedCriteriaIds = Object.keys(parsed.scores || {});
        const currentCriteriaIds = criteriaList.map((c) => c.id);
        const isMatch = currentCriteriaIds.every((id) => savedCriteriaIds.includes(id));

        if (isMatch) {
          setOverallComment(parsed.overallComment || '');
          setScores(parsed.scores || {});
          setComments(parsed.comments || {});
          setLastSavedAt(parsed.updatedAt || null);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [reviewAssignmentId, draftKey, criteriaList]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const saveDraft = useCallback(
    (newComment: string, newScores: Record<string, number>, newComments: Record<string, string>) => {
      setIsSaving(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        try {
          const nowStr = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const draftData: ReviewDraftState = {
            reviewAssignmentId,
            userId,
            overallComment: newComment,
            scores: newScores,
            comments: newComments,
            updatedAt: nowStr,
          };
          localStorage.setItem(draftKey, JSON.stringify(draftData));
          setLastSavedAt(nowStr);
        } catch {
          // Fail silently on storage errors
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [draftKey, reviewAssignmentId, userId]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }
    setOverallComment('');
    setScores({});
    setComments({});
    setLastSavedAt(null);
  }, [draftKey]);

  return {
    overallComment,
    setOverallComment,
    scores,
    setScores,
    comments,
    setComments,
    lastSavedAt,
    isSaving,
    saveDraft,
    clearDraft,
  };
}
