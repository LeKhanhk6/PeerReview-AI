import React, { useState, useEffect } from 'react';
import { reviewMessages } from '@/constants/messages/review';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createSubmitReviewSchema } from '../schemas/review.schema';
import { useAIMentor } from '../hooks/useAIMentor';
import { AIMentorWidget } from './AIMentorWidget';
import type { RubricDetail, SubmittedReviewDetail, SubmitReviewPayload } from '../types/review.types';
import { ClipboardList, Loader2, Save, AlertTriangle } from 'lucide-react';

interface RubricScoringFormProps {
  rubric: RubricDetail;
  existingReview?: SubmittedReviewDetail | null;
  isReadOnly?: boolean;
  draftComment?: string;
  draftScores?: Record<string, number>;
  draftComments?: Record<string, string>;
  lastSavedAt?: string | null;
  isSavingDraft?: boolean;
  onDraftChange?: (comment: string, scores: Record<string, number>, comments: Record<string, string>) => void;
  onSubmitReview: (payload: SubmitReviewPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const RubricScoringForm: React.FC<RubricScoringFormProps> = ({
  rubric,
  existingReview,
  isReadOnly = false,
  draftComment = '',
  draftScores = {},
  draftComments = {},
  lastSavedAt,
  isSavingDraft = false,
  onDraftChange,
  onSubmitReview,
  isSubmitting = false,
}) => {
  const criteriaList = rubric?.criteria || [];

  const [overallComment, setOverallComment] = useState<string>(draftComment);
  const [scores, setScores] = useState<Record<string, number>>(draftScores);
  const [comments, setComments] = useState<Record<string, string>>(draftComments);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // AI Mentor integration hook
  const {
    analysis: aiAnalysis,
    isLoading: isAILoading,
    isError: isAIError,
    isCircuitBreakerActive,
    triggerManualAnalysis,
  } = useAIMentor({
    comment: overallComment,
    isReadOnly,
  });

  // Sync existing review if completed
  useEffect(() => {
    if (existingReview) {
      setOverallComment(existingReview.comment || '');
      const scoreMap: Record<string, number> = {};
      const commentMap: Record<string, string> = {};
      existingReview.scores?.forEach((item) => {
        scoreMap[item.criteriaId] = item.score;
        if (item.comment) commentMap[item.criteriaId] = item.comment;
      });
      setScores(scoreMap);
      setComments(commentMap);
    }
  }, [existingReview]);

  // Sync draft values when restored
  useEffect(() => {
    if (!existingReview && !isReadOnly) {
      if (draftComment) setOverallComment(draftComment);
      if (Object.keys(draftScores).length > 0) setScores(draftScores);
      if (Object.keys(draftComments).length > 0) setComments(draftComments);
    }
  }, [draftComment, draftScores, draftComments, existingReview, isReadOnly]);

  // Compute live preview total score: SUM(score)
  const computedTotalScore = criteriaList.reduce((acc, criterion) => {
    const s = scores[criterion.id] || 0;
    return acc + s;
  }, 0);

  const handleScoreChange = (criteriaId: string, valStr: string) => {
    if (isReadOnly) return;
    const num = parseFloat(valStr);
    const safeNum = isNaN(num) ? 0 : Math.max(0, num);
    const updatedScores = { ...scores, [criteriaId]: safeNum };
    setScores(updatedScores);
    onDraftChange?.(overallComment, updatedScores, comments);
  };

  const handleCriterionCommentChange = (criteriaId: string, val: string) => {
    if (isReadOnly) return;
    const updatedComments = { ...comments, [criteriaId]: val };
    setComments(updatedComments);
    onDraftChange?.(overallComment, scores, updatedComments);
  };

  const handleOverallCommentChange = (val: string) => {
    if (isReadOnly) return;
    setOverallComment(val);
    onDraftChange?.(val, scores, comments);
  };

  const handleApplySuggestedRewrite = (suggestedText: string) => {
    handleOverallCommentChange(suggestedText);
  };

  const handleFormSubmitTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    // Validate with Zod
    const schema = createSubmitReviewSchema(criteriaList);
    const criteriaScoresPayload = criteriaList.map((c) => ({
      criteriaId: c.id,
      score: scores[c.id] || 0,
      comment: comments[c.id] || undefined,
    }));

    const result = schema.safeParse({
      overallComment,
      criteriaScores: criteriaScoresPayload,
    });

    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const pathStr = issue.path.join('.');
        errMap[pathStr] = issue.message;
      });
      setValidationErrors(errMap);
      return;
    }

    setValidationErrors({});
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const criteriaScoresPayload = criteriaList.map((c) => ({
      criteriaId: c.id,
      score: scores[c.id] || 0,
      comment: comments[c.id] || undefined,
    }));

    // Payload sent ONLY includes overallComment + criteriaScores (totalScore is calculated on backend!)
    const payload: SubmitReviewPayload = {
      overallComment: overallComment.trim(),
      criteriaScores: criteriaScoresPayload,
    };

    try {
      await onSubmitReview(payload);
      setIsConfirmOpen(false);
    } catch {
      setIsConfirmOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleFormSubmitTrigger}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6 h-full overflow-y-auto"
      aria-label={reviewMessages.writing.scoringPanelTitle}
    >
      {/* Panel Header */}
      <div className="border-b border-gray-100 pb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-700" />
            <span>{reviewMessages.writing.scoringPanelTitle}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {reviewMessages.writing.scoringPanelSubtitle}
          </p>
        </div>

        {/* Draft Auto-save Indicator */}
        {!isReadOnly && (
          <div className="text-right text-xs">
            {isSavingDraft ? (
              <span className="text-amber-600 font-medium animate-pulse flex items-center gap-1.5 justify-end">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {reviewMessages.writing.draftSaving}
              </span>
            ) : lastSavedAt ? (
              <span className="text-gray-500 font-medium flex items-center gap-1.5 justify-end">
                <Save className="w-3.5 h-3.5" /> {reviewMessages.writing.draftSavedAt} {lastSavedAt}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* List of Criteria Inputs */}
      <div className="space-y-6">
        {criteriaList.map((criterion, index) => {
          const scoreVal = scores[criterion.id] ?? '';
          const commentVal = comments[criterion.id] || '';
          const errorMsg = validationErrors[`criteriaScores.${index}.score`] || validationErrors.criteriaScores;

          return (
            <div
              key={criterion.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {index + 1}. {criterion.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Trọng số: {criterion.weight}%
                </span>
              </div>

              {criterion.description && (
                <p className="text-xs text-gray-600 leading-relaxed">
                  {criterion.description}
                </p>
              )}

              {/* Score Input with Clear Label (Points / Max Weight) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor={`score-${criterion.id}`}
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Điểm số (0 đến {criterion.weight})
                  </label>
                  <div className="relative rounded-md shadow-2xs">
                    <input
                      id={`score-${criterion.id}`}
                      type="number"
                      min={0}
                      max={criterion.weight}
                      step={0.5}
                      disabled={isReadOnly}
                      value={scoreVal}
                      onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                      placeholder={`0 - ${criterion.weight}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                      /{criterion.weight}
                    </span>
                  </div>
                </div>

                {/* Criterion-specific Comment */}
                <div>
                  <label
                    htmlFor={`comment-${criterion.id}`}
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Nhận xét tiêu chí (Không bắt buộc)
                  </label>
                  <input
                    id={`comment-${criterion.id}`}
                    type="text"
                    disabled={isReadOnly}
                    value={commentVal}
                    onChange={(e) => handleCriterionCommentChange(criterion.id, e.target.value)}
                    placeholder={reviewMessages.writing.criterionCommentPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1.5" role="alert">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Comment Area */}
      <div className="space-y-3 border-t border-gray-100 pt-5">
        <label
          htmlFor="overall-comment"
          className="block text-xs font-bold text-gray-900 uppercase tracking-wider"
        >
          {reviewMessages.writing.overallCommentLabel} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="overall-comment"
          rows={4}
          disabled={isReadOnly}
          value={overallComment}
          onChange={(e) => handleOverallCommentChange(e.target.value)}
          onBlur={() => triggerManualAnalysis()}
          placeholder={reviewMessages.writing.overallCommentPlaceholder}
          className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
        {validationErrors.overallComment && (
          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1.5" role="alert">
            <AlertTriangle className="w-3.5 h-3.5" /> {validationErrors.overallComment}
          </p>
        )}

        {/* AI Peer-Review Mentor Widget Integration (Hidden in Read-only mode) */}
        {!isReadOnly && (
          <AIMentorWidget
            analysis={aiAnalysis}
            isLoading={isAILoading}
            isError={isAIError}
            isCircuitBreakerActive={isCircuitBreakerActive}
            currentCommentLength={overallComment.trim().length}
            onApplySuggestedRewrite={handleApplySuggestedRewrite}
            onManualTrigger={triggerManualAnalysis}
          />
        )}
      </div>

      {/* Live Preview Total Weighted Score Banner */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-900">
          {reviewMessages.writing.totalScoreLabel}
        </span>
        <span className="text-xl font-black text-indigo-700 font-mono">
          {computedTotalScore.toFixed(2)} / 100
        </span>
      </div>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5"
          >
            <span>{reviewMessages.writing.submitButton}</span>
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Button>
        </div>
      )}

      {/* Confirmation Dialog Reused from @/components/ui/ConfirmDialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={reviewMessages.writing.confirmSubmitTitle}
        description={reviewMessages.writing.confirmSubmitDescription}
      />
    </form>
  );
};
