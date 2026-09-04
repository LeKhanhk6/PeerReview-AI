import React, { useState, useEffect, useRef } from 'react';
import { submissionMessages } from '@/constants/messages/submission';
import { Clock, AlertCircle, Hourglass, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DeadlineCountdownProps {
  deadline: string;
  onStatusChange?: (status: 'OPEN' | 'URGENT' | 'EXPIRED') => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalDiffMs: number;
}

const calculateTimeLeft = (targetDateStr: string): TimeLeft => {
  const targetTime = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalDiffMs: 0 };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false, totalDiffMs: diffMs };
};

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({
  deadline,
  onStatusChange,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(deadline));
  const [urgencyStatus, setUrgencyStatus] = useState<'OPEN' | 'URGENT' | 'EXPIRED'>('OPEN');
  const prevStatusRef = useRef<'OPEN' | 'URGENT' | 'EXPIRED'>('OPEN');

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft(deadline);
      setTimeLeft(updated);

      let newStatus: 'OPEN' | 'URGENT' | 'EXPIRED' = 'OPEN';
      if (updated.isExpired) {
        newStatus = 'EXPIRED';
      } else if (updated.totalDiffMs <= 24 * 60 * 60 * 1000) {
        newStatus = 'URGENT';
      }

      setUrgencyStatus(newStatus);

      if (prevStatusRef.current !== newStatus) {
        prevStatusRef.current = newStatus;
        onStatusChange?.(newStatus);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onStatusChange]);

  const formattedDeadlineStr = new Date(deadline).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getStatusBadge = () => {
    if (urgencyStatus === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{submissionMessages.countdown.statusExpired}</span>
        </span>
      );
    }
    if (urgencyStatus === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Hourglass className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{submissionMessages.countdown.statusUrgent}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{submissionMessages.countdown.statusOpen}</span>
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Clock className="w-4 h-4" /> {submissionMessages.countdown.title}
          </span>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{formattedDeadlineStr}</p>
        </div>

        {/* Status Badge with aria-live only on status changes */}
        <div aria-live="polite" aria-atomic="true">
          {getStatusBadge()}
        </div>
      </div>

      {/* Countdown Timer Numbers */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
          <span className="text-xl font-black text-gray-900 block font-mono">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {submissionMessages.countdown.days}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
          <span className="text-xl font-black text-gray-900 block font-mono">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {submissionMessages.countdown.hours}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
          <span className="text-xl font-black text-gray-900 block font-mono">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {submissionMessages.countdown.minutes}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
          <span className="text-xl font-black text-gray-900 block font-mono">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {submissionMessages.countdown.seconds}
          </span>
        </div>
      </div>

      {urgencyStatus === 'EXPIRED' && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <span>{submissionMessages.countdown.lateWarning}</span>
        </div>
      )}
    </div>
  );
};
