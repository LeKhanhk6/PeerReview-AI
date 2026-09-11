import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ClipboardCheck, Clock, Send, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
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
  const [isPublished, setIsPublished] = useState(false);
  const [allowEarlyInternalEval, setAllowEarlyInternalEval] = useState(false);
  
  // For error-driven state correction
  const [serverForcedClosed, setServerForcedClosed] = useState(false);
  const [serverForcedNotOpen, setServerForcedNotOpen] = useState(false);

  const messages = layoutMessages.internalEvaluation;
  const peers = groupMembers.filter(m => m.id !== currentUserId);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        setFetching(true);
        setHasSavedData(false);
        const resData: any = await getMyEvaluations(assignmentId, groupId);
        const data = Array.isArray(resData) ? resData : resData?.evaluations || [];
        const publishedFlag = Boolean(resData?.isPublished);
        const earlyFlag = Boolean(resData?.allowEarlyInternalEval);
        setIsPublished(publishedFlag);
        setAllowEarlyInternalEval(earlyFlag);

        const newEvals: Record<string, { c2: number; c3: number; c4: number }> = {};
        
        // Initialize all peers with 0 (no default rating)
        peers.forEach(p => {
          newEvals[p.id] = { c2: 0, c3: 0, c4: 0 };
        });

        // Override with existing data
        let foundExisting = false;
        data.forEach((item: any) => {
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
        setHasSavedData(foundExisting);
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
    if (isPublished) return 'PUBLISHED';
    if (serverForcedNotOpen) return 'NOT_OPEN';
    if (serverForcedClosed) return 'CLOSED';

    const now = new Date();
    const submissionDate = new Date(dueDate);
    
    // Default review deadline is 24h after submission if not provided
    const reviewDate = reviewDeadline 
      ? new Date(reviewDeadline) 
      : new Date(submissionDate.getTime() + 24 * 60 * 60 * 1000);

    if (now > reviewDate) return 'CLOSED';
    if (!allowEarlyInternalEval && now < submissionDate) return 'NOT_OPEN';
    return 'OPEN';
  }, [dueDate, reviewDeadline, serverForcedNotOpen, serverForcedClosed, isPublished, allowEarlyInternalEval]);


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
            {windowState === 'PUBLISHED' && 'Giảng viên đã công bố kết quả đánh giá cho bài tập này.'}
          </span>

          {windowState === 'OPEN' && (
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Đang mở chấm
            </span>
          )}

          {windowState === 'PUBLISHED' && (
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Đã công bố & Khóa
            </span>
          )}
        </div>
      </div>

      {windowState === 'PUBLISHED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm rounded-xl font-medium flex items-center gap-2.5 shadow-2xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Giảng viên đã công bố kết quả đánh giá bài tập này. Tất cả phiếu chấm nội bộ đã được đóng băng và khóa chỉnh sửa.</span>
        </div>
      )}

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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              {!isFormComplete ? (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Vui lòng chọn số sao (1-5 sao) cho tất cả các chỉ số của các thành viên.</span>
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Đã hoàn thành chọn sao. Sẵn sàng lưu đánh giá.</span>
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isFormComplete || loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{hasSavedData ? 'Cập nhật Đánh Giá' : 'Gửi Đánh Giá Nội Bộ'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
