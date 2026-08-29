import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeReviewText } from '../api/review.api';
import type { AIMentorAnalysis } from '../types/review.types';

interface UseAIMentorOptions {
  comment: string;
  isReadOnly?: boolean;
}

export function useAIMentor({ comment, isReadOnly = false }: UseAIMentorOptions) {
  const [analysis, setAnalysis] = useState<AIMentorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  const isCircuitBreakerActive = consecutiveFailures >= 3;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performAnalysis = useCallback(
    async (textToAnalyze: string, isManual = false) => {
      if (!textToAnalyze || textToAnalyze.trim().length < 15 || isReadOnly) {
        setAnalysis(null);
        setIsLoading(false);
        setIsError(false);
        return;
      }

      // Abort previous in-flight request to prevent race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setIsError(false);

      // Auto-retry once on network failure
      let attempts = 0;
      const maxAttempts = 2;
      let success = false;
      let lastResult: AIMentorAnalysis | null = null;

      while (attempts < maxAttempts && !success && !controller.signal.aborted) {
        attempts++;
        try {
          lastResult = await analyzeReviewText(textToAnalyze, controller.signal);
          success = true;
        } catch (err: any) {
          if (err?.name === 'CanceledError' || err?.name === 'AbortError' || controller.signal.aborted) {
            // Request was aborted intentionally, do not count as failure
            return;
          }
          if (attempts >= maxAttempts) {
            // Reached max attempts
            break;
          }
        }
      }

      if (controller.signal.aborted) return;

      setIsLoading(false);

      if (success && lastResult) {
        setAnalysis(lastResult);
        setConsecutiveFailures(0); // Reset failures on success
        setIsError(false);
      } else {
        setIsError(true);
        if (!isManual) {
          setConsecutiveFailures((prev) => prev + 1);
        }
      }
    },
    [isReadOnly]
  );

  // Debounced auto-trigger (1.5s) when comment changes
  useEffect(() => {
    if (isReadOnly || isCircuitBreakerActive) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!comment || comment.trim().length < 15) {
      setAnalysis(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      performAnalysis(comment.trim());
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [comment, isReadOnly, isCircuitBreakerActive, performAnalysis]);

  // Unmount cleanup: cancel timer and abort active request
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const triggerManualAnalysis = useCallback(() => {
    performAnalysis(comment.trim(), true);
  }, [comment, performAnalysis]);

  const resetCircuitBreaker = useCallback(() => {
    setConsecutiveFailures(0);
  }, []);

  return {
    analysis,
    isLoading,
    isError,
    isCircuitBreakerActive,
    consecutiveFailures,
    triggerManualAnalysis,
    resetCircuitBreaker,
  };
}
