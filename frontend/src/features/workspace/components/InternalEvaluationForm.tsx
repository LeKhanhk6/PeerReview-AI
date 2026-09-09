import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ClipboardCheck, Clock } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { layoutMessages } from '@/constants/messages/layout';
import { submitInternalEvaluation, getMyEvaluations } from '../api/internalEvaluation.api';
import { toastSuccess, toastError } from '@/lib/toast';

interface Member {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface InternalEvaluationFormProps {
  assignmentId: string;
  groupId: string;
  groupMembers: Member[];
  currentUserId: string;
  dueDate: string; // ISO string
  reviewDeadline?: string; // ISO string
  assignmentTitle?: string;
  availableAssignments?: Array<{ assignment_id?: string; id?: string; title: string; deadline?: string }>;
  onSelectAssignment?: (id: string) => void;
}

export const InternalEvaluationForm: React.FC<InternalEvaluationFormProps> = ({
  assignmentId,
  groupId,
  groupMembers,
  currentUserId,
  dueDate,
  reviewDeadline,
  assignmentTitle,
  availableAssignments = [],
  onSelectAssignment
}) => {
  const [evaluations, setEvaluations] = useState<Record<string, { c2: number; c3: number; c4: number }>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasSavedData, setHasSavedData] = useState(false);
  
  // For error-driven state correction
  const [serverForcedClosed, setServerForcedClosed] = useState(false);
  const [serverForcedNotOpen, setServerForcedNotOpen] = useState(false);

  const messages = layoutMessages.internalEvaluation;
  const peers = groupMembers.filter(m => m.id !== currentUserId);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        setFetching(true);
        const data = await getMyEvaluations(assignmentId, groupId);
        const newEvals: Record<string, { c2: number; c3: number; c4: number }> = {};
        
        // Initialize all peers with 0 (no default rating)
        peers.forEach(p => {
          newEvals[p.id] = { c2: 0, c3: 0, c4: 0 };
        });

        // Override with existing data
        let foundExisting = false;
        data.forEach(item => {
          if (newEvals[item.evaluatee_id]) {
            newEvals[item.evaluatee_id] = {
              c2: item.c2_score,
              c3: item.c3_score,
              c4: item.c4_score
            };
            foundExisting = true;
          }
        });
        setEvaluations(newEvals);
        if (foundExisting) setHasSavedData(true);
      } catch (error) {
        console.error('Failed to fetch evaluations:', error);
      } finally {
        setFetching(false);
      }
    };
    if (assignmentId && groupId && peers.length > 0) {
      fetchExisting();
    } else {
      setFetching(false);
    }
  }, [assignmentId, groupId, currentUserId]); // Intentionally omitting peers to avoid refetch loops

  const windowState = useMemo(() => {
    if (serverForcedNotOpen) return 'NOT_OPEN';
    if (serverForcedClosed) return 'CLOSED';

    const now = new Date();
    const submissionDate = new Date(dueDate);
    
    // Default review deadline is 24h after submission if not provided
    const reviewDate = reviewDeadline 
      ? new Date(reviewDeadline) 
      : new Date(submissionDate.getTime() + 24 * 60 * 60 * 1000);

    if (now < submissionDate) return 'NOT_OPEN';
    if (now > reviewDate) return 'CLOSED';
    return 'OPEN';
  }, [dueDate, reviewDeadline, serverForcedNotOpen, serverForcedClosed]);

  const isFormComplete = useMemo(() => {
    if (peers.length === 0) return false;
    return peers.every(peer => {
      const ev = evaluations[peer.id];
      return ev && ev.c2 > 0 && ev.c3 > 0 && ev.c4 > 0;
    });
  }, [evaluations, peers]);

  const handleRatingChange = (peerId: string, criteria: 'c2' | 'c3' | 'c4', value: number) => {
    setEvaluations(prev => ({
      ...prev,
      [peerId]: {
        ...prev[peerId],
        [criteria]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!isFormComplete) return;
    setLoading(true);
    
    const promises = peers.map(peer => {
      const ev = evaluations[peer.id];
      return submitInternalEvaluation(assignmentId, groupId, {
        evaluateeId: peer.id,
        c2_score: ev.c2,
        c3_score: ev.c3,
        c4_score: ev.c4
      });
    });

    const results = await Promise.allSettled(promises);
    setLoading(false);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const total = peers.length;

    // Error-driven state correction check
    const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    let hasWindowError = false;
    rejected.forEach(r => {
      const msg = r.reason?.message || '';
      if (msg.includes('đã kết thúc')) {
        setServerForcedClosed(true);
        hasWindowError = true;
      }
      if (msg.includes('Chưa đến thời gian')) {
        setServerForcedNotOpen(true);
        hasWindowError = true;
      }
    });

    if (hasWindowError) {
      toastError({ message: 'Lỗi thời hạn: Đã tải lại trạng thái hệ thống' });
      return;
    }

    if (successCount === total) {
      setHasSavedData(true);
      toastSuccess(messages.saveSuccess);
    } else {
      const firstError = rejected[0]?.reason?.response?.data?.message || rejected[0]?.reason?.message || 'Lỗi không xác định';
      toastError({ message: `Lưu thất bại: ${firstError}` });
    }
  };

  const getDisplayName = (user: Member) => {
    if (user.full_name) return user.full_name;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (user.email) return user.email.split('@')[0];
    return 'Thành viên';
  };

  if (fetching) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (peers.length === 0) {
    return <div className="p-4 border rounded-md text-muted-foreground text-center">Không có thành viên nào khác để đánh giá.</div>;
  }

  const isReadOnly = windowState !== 'OPEN';
  const effectiveReviewDeadline = reviewDeadline 
    ? new Date(reviewDeadline).toLocaleString('vi-VN') 
    : new Date(new Date(dueDate).getTime() + 24 * 60 * 60 * 1000).toLocaleString('vi-VN');

  return (
    <div className="space-y-6">
      {/* Assignment Header Card & Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">Đánh giá Đóng góp Nội bộ</span>
              <h3 className="font-extrabold text-base text-white truncate" title={assignmentTitle}>
                {assignmentTitle ? `Bài tập: ${assignmentTitle}` : 'Bài tập nhóm'}
              </h3>
            </div>
          </div>

          {availableAssignments && availableAssignments.length > 1 && onSelectAssignment && (
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
              <label htmlFor="eval-assignment-select" className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                Đổi bài tập:
              </label>
              <select
                id="eval-assignment-select"
                value={assignmentId}
                onChange={(e) => onSelectAssignment(e.target.value)}
                className="bg-slate-900 text-xs font-semibold text-white px-2.5 py-1 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {availableAssignments.map((asm) => {
                  const id = asm.assignment_id || asm.id || '';
                  return (
                    <option key={id} value={id}>
                      {asm.title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            {windowState === 'NOT_OPEN' && messages.notOpen}
            {windowState === 'OPEN' && `${messages.openUntil} ${effectiveReviewDeadline}`}
            {windowState === 'CLOSED' && messages.closed}
          </span>

          {windowState === 'OPEN' && (
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Đang mở chấm
            </span>
          )}
        </div>
      </div>

      {windowState !== 'NOT_OPEN' && (
        <div className="space-y-6">
          {peers.map(peer => (
            <div key={peer.id} className="p-4 border rounded-lg bg-card">
              <h4 className="font-semibold mb-4 text-base">{getDisplayName(peer)}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Chất lượng công việc (C2)</p>
                  <StarRating 
                    value={evaluations[peer.id]?.c2 || 0} 
                    onChange={(v) => handleRatingChange(peer.id, 'c2', v)} 
                    disabled={isReadOnly || loading} 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hoàn thành đúng hạn (C3)</p>
                  <StarRating 
                    value={evaluations[peer.id]?.c3 || 0} 
                    onChange={(v) => handleRatingChange(peer.id, 'c3', v)} 
                    disabled={isReadOnly || loading} 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Phối hợp & Giao tiếp (C4)</p>
                  <StarRating 
                    value={evaluations[peer.id]?.c4 || 0} 
                    onChange={(v) => handleRatingChange(peer.id, 'c4', v)} 
                    disabled={isReadOnly || loading} 
                  />
                </div>
              </div>
            </div>
          ))}

          {windowState === 'OPEN' && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={!isFormComplete || loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? messages.loading : (hasSavedData ? 'Cập nhật Đánh Giá' : messages.submitBtn)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
